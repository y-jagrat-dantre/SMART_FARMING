import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface CropPredictorProps {
  sensorData: any;
  onPrediction: (crop: string) => void;
}

export const CropPredictor = ({ sensorData, onPrediction }: CropPredictorProps) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const predictCrop = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('crop-prediction', {
        body: { 
          sensorData,
          language: i18n.language
        }
      });

      if (error) throw error;

      setPrediction(data);
      onPrediction(data.cropName);
      toast({
        title: t('predictionComplete'),
        description: `${t('recommendedCrop')}: ${data.cropName}`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: t('error'),
        description: t('predictionFailed'),
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
      transition={{ duration: 0.5, delay: 0.6 }}
      className="md:col-span-2"
    >
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-border shadow-[var(--shadow-glow)]">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-6 h-6 text-primary" />
              {t('cropPrediction')}
            </h3>
            <p className="text-muted-foreground mb-4">{t('cropPredictionDesc')}</p>
            
            {prediction && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-4 p-4 bg-card rounded-lg border border-primary/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Sprout className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <h4 className="text-xl font-bold text-primary">{prediction.cropName}</h4>
                    <p className="text-sm text-muted-foreground">{t('aiRecommended')}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground mb-2">{prediction.reason}</p>
                <p className="text-xs text-muted-foreground">{prediction.recommendations}</p>
              </motion.div>
            )}
          </div>
          
          <Button
            onClick={predictCrop}
            disabled={loading}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] min-w-[200px]"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('predictCrop')}
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
