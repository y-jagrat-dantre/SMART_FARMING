import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Cloud, CloudRain, Sun, Wind, Droplets, Search, MapPin, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
    city: string;
    country: string;
  };
  forecast: Array<{
    date: string;
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    wind_speed: number;
    description: string;
    icon: string;
  }>;
}

const getWeatherIcon = (iconCode: string) => {
  if (iconCode.includes('01')) return <Sun className="w-12 h-12 text-yellow-500" />;
  if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) 
    return <Cloud className="w-12 h-12 text-gray-400" />;
  if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11'))
    return <CloudRain className="w-12 h-12 text-blue-500" />;
  return <Sun className="w-12 h-12 text-yellow-500" />;
};

export const WeatherForecast = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchCity, setSearchCity] = useState('');

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('weather', {
        body: { lat, lon }
      });

      if (error) throw error;
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city: string) => {
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('weather', {
        body: { city }
      });

      if (error) throw error;
      setWeather(data);
      toast.success(`Weather loaded for ${data.current.city}`);
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error('Failed to fetch weather for this city');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to a default city
          fetchWeatherByCity('London');
        }
      );
    } else {
      fetchWeatherByCity('London');
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      fetchWeatherByCity(searchCity.trim());
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className="w-full overflow-hidden border-2 border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sun className="w-6 h-6 text-primary" />
              {t('weatherForecast')}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-2">
              <MapPin className="w-4 h-4" />
              {weather.current.city}, {weather.current.country}
            </CardDescription>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder={t('searchCity')}
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full md:w-64"
            />
            <Button type="submit" disabled={searching} size="icon">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Current Weather */}
        <div className="mb-8 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {getWeatherIcon(weather.current.icon)}
              <div>
                <div className="text-5xl font-bold text-foreground">{weather.current.temp}°C</div>
                <div className="text-muted-foreground capitalize">{weather.current.description}</div>
                <div className="text-sm text-muted-foreground">
                  {t('feelsLike')}: {weather.current.feels_like}°C
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-center md:text-left">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('humidity')}</div>
                  <div className="text-lg font-semibold">{weather.current.humidity}%</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm text-muted-foreground">{t('windSpeed')}</div>
                  <div className="text-lg font-semibold">{weather.current.wind_speed} km/h</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-foreground">{t('fiveDayForecast')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/30 border border-border hover:border-primary transition-all duration-200 hover:shadow-md"
              >
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {formatDate(day.date)}
                </div>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.icon)}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{day.temp}°C</div>
                  <div className="text-xs text-muted-foreground">
                    {day.temp_min}° / {day.temp_max}°
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 capitalize">
                    {day.description}
                  </div>
                  <div className="flex justify-center gap-3 mt-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Droplets className="w-3 h-3" />
                      {day.humidity}%
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      {day.wind_speed}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
