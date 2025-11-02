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
    const { sensorData, language = 'en' } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'te': 'Telugu'
    };

    const targetLanguage = languageNames[language] || 'English';

    const prompt = `Based on these sensor readings from a smart farm:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Soil Moisture: ${sensorData.soilMoisture}%
- pH Level: ${sensorData.pH}
- Light Intensity: ${sensorData.light} lux

Which crop is most suitable to grow right now in this farm? Please provide:
1. The name of the recommended crop
2. A brief explanation (2-3 sentences) of why this crop is suitable
3. Any specific care recommendations

IMPORTANT: Provide your entire response in ${targetLanguage} language.
Format your response as JSON with keys: cropName, reason, recommendations`;

    console.log('Calling Gemini API for crop prediction...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 512,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Crop prediction received');
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse JSON from response
    let prediction;
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      prediction = JSON.parse(jsonStr);
    } catch (e) {
      // Fallback if not valid JSON
      prediction = {
        cropName: 'Various Suitable Crops',
        reason: aiResponse.substring(0, 200),
        recommendations: 'Consult with local agricultural experts for specific recommendations.'
      };
    }

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crop-prediction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
