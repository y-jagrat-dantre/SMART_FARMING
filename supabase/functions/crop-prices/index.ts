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
    const { cropName, location, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const languageNames: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'te': 'Telugu'
    };

    const targetLanguage = languageNames[language] || 'English';

    const prompt = `You are an agricultural market analyst for Indian farmers. Provide current market information for the following:

Crop: ${cropName}
Location: ${location}

Please provide:
1. Current wholesale price (per quintal in INR)
2. Current retail price (per quintal in INR)
3. Price trend analysis (last 7-30 days) - mention if prices are rising, falling, or stable
4. Market insights and predictions (factors affecting prices like weather, demand, season)
5. Best time to sell recommendations
6. Nearby mandis/markets with better rates

Reference sources like Agmarknet, government market data, and current agricultural trends in India. Be specific and practical.

IMPORTANT: Provide your entire response in ${targetLanguage} language.
Format the response in a clear, structured way that farmers can easily understand.`;

    console.log('Calling Lovable AI for crop prices...');
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
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received for crop prices');
    
    const priceInfo = data.choices?.[0]?.message?.content || 'Sorry, I could not generate price information.';

    return new Response(
      JSON.stringify({ priceInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crop-prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
