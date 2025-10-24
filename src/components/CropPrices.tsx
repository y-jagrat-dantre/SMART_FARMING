import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ref, set, get, push } from 'firebase/database';
import { database } from '@/lib/firebase';
import { TrendingUp, MapPin, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const CROPS = [
  'Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Sugarcane', 
  'Potato', 'Onion', 'Tomato', 'Groundnut', 'Mustard', 'Pulses',
  'Bajra', 'Jowar', 'Barley', 'Chickpea', 'Lentils'
];

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

export const CropPrices = () => {
  const [cropName, setCropName] = useState('');
  const [location, setLocation] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPriceInfo, setShowPriceInfo] = useState(true);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Load last query from Firebase
  useEffect(() => {
    const loadLastQuery = async () => {
      try {
        const queryRef = ref(database, 'cropPriceQueries/last');
        const snapshot = await get(queryRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCropName(data.cropName || '');
          setLocation(data.location || '');
        }
      } catch (error) {
        console.error('Error loading last query:', error);
      }
    };
    loadLastQuery();
  }, []);

  const getCropPrices = async () => {
    if (!cropName || !location) {
      toast({
        title: t('prices.error'),
        description: t('prices.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Save query to Firebase for tracking
      const queriesRef = ref(database, 'cropPriceQueries/history');
      await push(queriesRef, {
        cropName,
        location,
        timestamp: new Date().toISOString(),
      });

      // Save as last query
      const lastQueryRef = ref(database, 'cropPriceQueries/last');
      await set(lastQueryRef, { cropName, location });

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('crop-prices', {
        body: { cropName, location, language: i18n.language },
      });

      if (error) throw error;

      setPriceInfo(data.priceInfo);
      toast({
        title: t('prices.success'),
        description: t('prices.infoRetrieved'),
      });
    } catch (error) {
      console.error('Error getting crop prices:', error);
      toast({
        title: t('prices.error'),
        description: t('prices.failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('prices.title')}
          </CardTitle>
          <CardDescription>{t('prices.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('prices.cropName')}</label>
              <Select value={cropName} onValueChange={setCropName}>
                <SelectTrigger>
                  <SelectValue placeholder={t('prices.selectCrop')} />
                </SelectTrigger>
                <SelectContent>
                  {CROPS.map((crop) => (
                    <SelectItem key={crop} value={crop}>
                      {crop}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('prices.location')}</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder={t('prices.selectState')} />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={getCropPrices} 
            disabled={loading}
            className="w-full"
          >
            {loading ? t('prices.loading') : t('prices.getPrices')}
          </Button>

          {priceInfo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-accent/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IndianRupee className="h-4 w-4" />
                  {t('prices.marketInsights')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPriceInfo(!showPriceInfo)}
                  className="h-8"
                >
                  {showPriceInfo ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              {showPriceInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                >
                  {priceInfo}
                </motion.div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
