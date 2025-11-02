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
    const { messages, sensorData, predictedCrop, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context from sensor data
    let context = '';
    if (sensorData) {
      context = `\n\nCurrent Farm Sensor Data:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Soil Moisture: ${sensorData.soilMoisture}%
- pH Level: ${sensorData.pH}
- Light Intensity: ${sensorData.light} lux`;
    }

    if (predictedCrop) {
      context += `\n\nAI Predicted Crop: ${predictedCrop}`;
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'te': 'Telugu'
    };

    const targetLanguage = languageNames[language] || 'English';
    const userMessage = messages[messages.length - 1]?.content || '';
    
    console.log('Calling Lovable AI...');
    const response = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: `You are a helpful smart farming assistant. You can answer questions about farming, analyze sensor data, and provide agricultural advice. IMPORTANT: Always respond in ${targetLanguage} language.${context}`
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');
    
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in gemini-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
