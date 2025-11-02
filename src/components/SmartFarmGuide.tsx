import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar, Droplets, Sun, AlertTriangle, Sparkles, Play, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface SmartFarmGuideProps {
  sensorData: any;
  predictedCrop: string | null;
}

interface GuideData {
  active: boolean;
  startDate: string | null;
  farmerCrop: string | null;
  cropDuration: number | null;
  dailyInstructions: { [key: string]: { instructions: string; generatedAt: string } };
}

const CROP_OPTIONS = [
  { value: 'rice', duration: 120 },
  { value: 'wheat', duration: 120 },
  { value: 'corn', duration: 90 },
  { value: 'tomato', duration: 80 },
  { value: 'potato', duration: 90 },
  { value: 'cotton', duration: 150 },
  { value: 'sugarcane', duration: 365 },
  { value: 'beans', duration: 60 },
];

export const SmartFarmGuide = ({ sensorData, predictedCrop }: SmartFarmGuideProps) => {
  const { t, i18n } = useTranslation();
  const [guideData, setGuideData] = useState<GuideData>({
    active: false,
    startDate: null,
    farmerCrop: null,
    cropDuration: null,
    dailyInstructions: {},
  });
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const todayInstructions = guideData.dailyInstructions[today];

  // Calculate days since planting
  const daysSincePlanting = guideData.startDate
    ? Math.floor((new Date().getTime() - new Date(guideData.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const progressPercentage = guideData.cropDuration
    ? Math.min((daysSincePlanting / guideData.cropDuration) * 100, 100)
    : 0;

  // Fetch guide data from Firebase
  useEffect(() => {
    const guideRef = ref(database, 'guide');
    const unsubscribe = onValue(guideRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGuideData({
          active: data.active || false,
          startDate: data.startDate || null,
          farmerCrop: data.farmerCrop || null,
          cropDuration: data.cropDuration || null,
          dailyInstructions: data.dailyInstructions || {},
        });
        if (data.farmerCrop) {
          setSelectedCrop(data.farmerCrop);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-generate instructions if guide is active and no instructions exist for today
  useEffect(() => {
    if (guideData.active && !todayInstructions && !generatingInstructions) {
      console.log('Auto-generating daily instructions...');
      generateDailyInstructions();
    }
  }, [guideData.active, todayInstructions]);

  // Set default to predicted crop
  useEffect(() => {
    if (predictedCrop && !selectedCrop && !guideData.farmerCrop) {
      const matchingCrop = CROP_OPTIONS.find(
        (option) => option.value.toLowerCase() === predictedCrop.toLowerCase() || 
                    t(`crops.${option.value}`).toLowerCase() === predictedCrop.toLowerCase()
      );
      if (matchingCrop) {
        setSelectedCrop(matchingCrop.value);
      }
    }
  }, [predictedCrop, selectedCrop, guideData.farmerCrop, t]);

  // Auto-generate daily instructions if guide is active and no instructions exist for today
  useEffect(() => {
    if (guideData.active && !todayInstructions && !generatingInstructions) {
      console.log('No instructions for today, auto-generating...');
      generateDailyInstructions();
    }
  }, [guideData.active, todayInstructions, generatingInstructions]);

  // Start the guide
  const handleStartGuide = async () => {
    if (!selectedCrop) {
      toast.error(t('selectCropFirst') || 'Please select a crop first');
      return;
    }

    setLoading(true);
    try {
      const cropOption = CROP_OPTIONS.find((c) => c.value === selectedCrop);
      const startDate = new Date().toISOString().split('T')[0];

      // Store guide data in Firebase
      await set(ref(database, 'guide'), {
        active: true,
        startDate,
        farmerCrop: selectedCrop,
        cropDuration: cropOption?.duration || 90,
        dailyInstructions: {},
      });

      toast.success(t('guideStarted') || 'Smart Farm Guide started successfully!');
      
      // Generate first day instructions
      await generateDailyInstructions();
    } catch (error) {
      console.error('Error starting guide:', error);
      toast.error(t('guideFailed') || 'Failed to start guide');
    } finally {
      setLoading(false);
    }
  };

  // Generate daily instructions using Gemini AI
  const generateDailyInstructions = async () => {
    setGeneratingInstructions(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-guide', {
        body: {
          crop: guideData.farmerCrop || selectedCrop,
          sensorData,
          daysSincePlanting,
          cropDuration: guideData.cropDuration,
          language: i18n.language,
        },
      });

      if (error) throw error;

      // Store instructions in Firebase
      const instructionsRef = ref(database, `guide/dailyInstructions/${today}`);
      await set(instructionsRef, {
        instructions: data.instructions,
        generatedAt: data.generatedAt,
      });

      toast.success(t('instructionsGenerated') || 'Daily instructions generated!');
    } catch (error) {
      console.error('Error generating instructions:', error);
      toast.error(t('instructionsFailed') || 'Failed to generate instructions');
    } finally {
      setGeneratingInstructions(false);
    }
  };

  // Stop the guide
  const handleStopGuide = async () => {
    try {
      await set(ref(database, 'guide/active'), false);
      toast.success(t('guideStopped') || 'Guide stopped');
    } catch (error) {
      console.error('Error stopping guide:', error);
      toast.error(t('guideStopFailed') || 'Failed to stop guide');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('smartFarmGuide') || 'Smart Farm Guide'}
          </CardTitle>
          <CardDescription>{t('aiPoweredGuidance') || 'AI-powered daily farming guidance'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!guideData.active ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('selectCrop') || 'Select Crop'}</label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('chooseCrop') || 'Choose a crop'} />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_OPTIONS.map((crop) => (
                      <SelectItem key={crop.value} value={crop.value}>
                        {t(`crops.${crop.value}`)} ({crop.duration} {t('days') || 'days'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {predictedCrop && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t('aiPredicted') || 'AI Predicted'}: {predictedCrop}
                  </p>
                )}
              </div>
              <Button onClick={handleStartGuide} disabled={loading || !selectedCrop} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                {loading ? t('starting') || 'Starting...' : t('startGuide') || 'Start Guide'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Crop Info & Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('currentCrop') || 'Current Crop'}</p>
                    <p className="text-lg font-semibold capitalize">{guideData.farmerCrop}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleStopGuide}>
                    {t('stopGuide') || 'Stop Guide'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {t('growthProgress') || 'Growth Progress'}
                    </span>
                    <span className="font-medium">
                      {daysSincePlanting} / {guideData.cropDuration} {t('days') || 'days'}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progressPercentage.toFixed(1)}% {t('complete') || 'complete'}
                  </p>
                </div>
              </div>

              {/* Daily Instructions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('todayInstructions') || "Today's Instructions"}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateDailyInstructions}
                      disabled={generatingInstructions}
                    >
                      {generatingInstructions ? t('generating') || 'Generating...' : t('refresh') || 'Refresh'}
                    </Button>
                    {todayInstructions && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInstructions(!showInstructions)}
                      >
                        {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {todayInstructions ? (
                  <motion.div
                    initial={false}
                    animate={{ height: showInstructions ? 'auto' : 0, opacity: showInstructions ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm">{todayInstructions.instructions}</div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('generated') || 'Generated'}: {new Date(todayInstructions.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('noInstructions') || 'No instructions for today yet'}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={generateDailyInstructions}
                      disabled={generatingInstructions}
                      className="mt-2"
                    >
                      {t('generateNow') || 'Generate Now'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Sensor Alerts */}
              <div className="grid grid-cols-2 gap-3">
                {sensorData?.soilMoisture < 30 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <Droplets className="w-4 h-4 text-destructive" />
                    <span className="text-xs">{t('lowMoisture') || 'Low Moisture'}</span>
                  </div>
                )}
                {sensorData?.temperature > 35 && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <Sun className="w-4 h-4 text-destructive" />
                    <span className="text-xs">{t('highTemp') || 'High Temp'}</span>
                  </div>
                )}
                {sensorData?.rainDetected && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <span className="text-xs">{t('rainDetected') || 'Rain Detected'}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
