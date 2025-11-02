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
    const { lat, lon, city } = await req.json();
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');

    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured');
      return new Response(
        JSON.stringify({ error: 'Weather service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let currentWeatherUrl = '';
    let forecastUrl = '';

    if (city) {
      currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    } else if (lat && lon) {
      currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either city name or coordinates required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching weather data...');
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl)
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.error('OpenWeatherMap API error:', currentResponse.status, forecastResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data' }),
        { status: currentResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentWeather = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process 5-day forecast (get one reading per day at noon)
    const dailyForecasts = forecastData.list
      .filter((item: any) => item.dt_txt.includes('12:00:00'))
      .slice(0, 5);

    console.log('Weather data fetched successfully');
    return new Response(
      JSON.stringify({
        current: {
          temp: Math.round(currentWeather.main.temp),
          feels_like: Math.round(currentWeather.main.feels_like),
          humidity: currentWeather.main.humidity,
          wind_speed: Math.round(currentWeather.wind.speed * 3.6), // Convert m/s to km/h
          description: currentWeather.weather[0].description,
          icon: currentWeather.weather[0].icon,
          city: currentWeather.name,
          country: currentWeather.sys.country,
        },
        forecast: dailyForecasts.map((day: any) => ({
          date: day.dt_txt.split(' ')[0],
          temp: Math.round(day.main.temp),
          temp_min: Math.round(day.main.temp_min),
          temp_max: Math.round(day.main.temp_max),
          humidity: day.main.humidity,
          wind_speed: Math.round(day.wind.speed * 3.6),
          description: day.weather[0].description,
          icon: day.weather[0].icon,
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weather function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
