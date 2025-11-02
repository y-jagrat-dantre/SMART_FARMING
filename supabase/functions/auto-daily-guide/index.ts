import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GuideData {
  active: boolean;
  startDate: string;
  farmerCrop: string;
  cropDuration: number;
  dailyInstructions?: {
    [key: string]: {
      instructions: string;
      generatedAt: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting auto-daily-guide generation...');

    // Initialize Firebase Admin (using REST API)
    const firebaseUrl = "https://medicine-indicator-1fbc8-default-rtdb.firebaseio.com";
    const today = new Date().toISOString().split('T')[0];

    // Fetch guide data from Firebase
    const guideResponse = await fetch(`${firebaseUrl}/guide.json`);
    if (!guideResponse.ok) {
      throw new Error('Failed to fetch guide data from Firebase');
    }

    const guideData: GuideData | null = await guideResponse.json();
    console.log('Guide data:', guideData);

    // Check if guide is active
    if (!guideData || !guideData.active) {
      console.log('No active guide found');
      return new Response(
        JSON.stringify({ message: 'No active guide to generate instructions for' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if instructions already exist for today
    if (guideData.dailyInstructions && guideData.dailyInstructions[today]) {
      console.log('Instructions already exist for today');
      return new Response(
        JSON.stringify({ message: 'Instructions already generated for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate days since planting
    const startDate = new Date(guideData.startDate);
    const currentDate = new Date();
    const daysSincePlanting = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`Generating instructions for ${guideData.farmerCrop}, day ${daysSincePlanting}`);

    // Fetch current sensor data
    const sensorResponse = await fetch(`${firebaseUrl}/SMART_FARM/sensors.json`);
    const sensorData = sensorResponse.ok ? await sensorResponse.json() : {};

    // Call the daily-guide function to generate instructions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: instructionsData, error: instructionsError } = await supabase.functions.invoke('daily-guide', {
      body: {
        crop: guideData.farmerCrop,
        sensorData: sensorData || {},
        daysSincePlanting,
        cropDuration: guideData.cropDuration,
        language: 'en', // Default language for auto-generation
      },
    });

    if (instructionsError) {
      console.error('Error generating instructions:', instructionsError);
      throw instructionsError;
    }

    console.log('Instructions generated successfully');

    // Store instructions in Firebase
    const instructionsPayload = {
      instructions: instructionsData.instructions,
      generatedAt: instructionsData.generatedAt,
    };

    const updateResponse = await fetch(
      `${firebaseUrl}/guide/dailyInstructions/${today}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructionsPayload),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to store instructions in Firebase');
    }

    console.log('Instructions stored successfully in Firebase');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily instructions generated and stored successfully',
        crop: guideData.farmerCrop,
        day: daysSincePlanting,
        date: today,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-daily-guide:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
