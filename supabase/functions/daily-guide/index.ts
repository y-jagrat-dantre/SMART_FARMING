import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop, sensorData, daysSincePlanting, cropDuration, language = 'en' } = await req.json();
    
    console.log('Generating daily guide for:', { crop, daysSincePlanting, cropDuration });

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Build context from sensor data
    const sensorContext = `
Current Sensor Readings:
- Temperature: ${sensorData?.temperature || 'N/A'}°C
- Humidity: ${sensorData?.humidity || 'N/A'}%
- Soil Moisture: ${sensorData?.soilMoisture || 'N/A'}%
- pH Level: ${sensorData?.phLevel || 'N/A'}
- Light Intensity: ${sensorData?.lightIntensity || 'N/A'} lux
- Rain Detection: ${sensorData?.rainDetected ? 'Yes' : 'No'}
`;

    const growthContext = daysSincePlanting && cropDuration 
      ? `\nCrop Growth Progress: Day ${daysSincePlanting} of ${cropDuration} days (${Math.round((daysSincePlanting / cropDuration) * 100)}% complete)`
      : '';

    const prompt = `You are an expert agricultural advisor providing daily farming guidance.

${sensorContext}
${growthContext}

Crop: ${crop}

Provide practical, actionable daily instructions in ${language} language for this farmer. Include:

1. **Watering Schedule**: Specific watering instructions based on soil moisture and weather
2. **Fertilizer Advice**: Any fertilization needs for today
3. **Light/Sun Exposure**: Guidance on light management
4. **Alerts**: Any critical alerts or warnings based on sensor readings
5. **General Tasks**: Other important tasks for today

Format your response as clear, numbered sections. Be specific and practical.`;

    console.log('Calling Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const instructions = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ 
        instructions,
        generatedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in daily-guide function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate daily guide' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
