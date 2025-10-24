import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ref, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Shield, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const CROPS = [
  'Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize', 'Sugarcane', 
  'Potato', 'Onion', 'Tomato', 'Groundnut', 'Mustard', 'Pulses'
];

const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid'];

export const InsuranceAdvice = () => {
  const [cropType, setCropType] = useState('');
  const [location, setLocation] = useState('');
  const [season, setSeason] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(true);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Load saved preferences from Firebase
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefsRef = ref(database, 'insurancePreferences');
        const snapshot = await get(prefsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCropType(data.cropType || '');
          setLocation(data.location || '');
          setSeason(data.season || '');
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const getInsuranceAdvice = async () => {
    if (!cropType || !location || !season) {
      toast({
        title: t('insurance.error'),
        description: t('insurance.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Save preferences to Firebase
      const prefsRef = ref(database, 'insurancePreferences');
      await set(prefsRef, { cropType, location, season, lastUpdated: new Date().toISOString() });

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('insurance-advice', {
        body: { cropType, location, season, language: i18n.language },
      });

      if (error) throw error;

      setAdvice(data.advice);
      toast({
        title: t('insurance.success'),
        description: t('insurance.adviceGenerated'),
      });
    } catch (error) {
      console.error('Error getting insurance advice:', error);
      toast({
        title: t('insurance.error'),
        description: t('insurance.failed'),
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
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('insurance.title')}
          </CardTitle>
          <CardDescription>{t('insurance.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('insurance.cropType')}</label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('insurance.selectCrop')} />
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
              <label className="text-sm font-medium">{t('insurance.location')}</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder={t('insurance.selectState')} />
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

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('insurance.season')}</label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('insurance.selectSeason')} />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={getInsuranceAdvice} 
            disabled={loading}
            className="w-full"
          >
            {loading ? t('insurance.loading') : t('insurance.getAdvice')}
          </Button>

          {advice && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-accent/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4" />
                  {t('insurance.aiRecommendations')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvice(!showAdvice)}
                  className="h-8"
                >
                  {showAdvice ? (
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
              {showAdvice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                >
                  {advice}
                </motion.div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
