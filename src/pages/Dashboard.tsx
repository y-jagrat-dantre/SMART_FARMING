import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ControlToggle } from '@/components/ControlToggle';
import { TimeInput } from '@/components/TimeInput';
import { DurationInput } from '@/components/DurationInput';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SensorGauge } from '@/components/SensorGauge';
import { SmartFarmGuide } from '@/components/SmartFarmGuide';
import { WeatherForecast } from '@/components/WeatherForecast';
import { WebpageViewer } from '@/components/WebpageViewer';
import { ChatBot } from '@/components/ChatBot';
import { CropPredictor } from '@/components/CropPredictor';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { InsuranceAdvice } from '@/components/InsuranceAdvice';
import { CropPrices } from '@/components/CropPrices';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sprout, Power, Zap, Droplets, LogOut, Thermometer, Droplet, Sun } from 'lucide-react';
import { SliderInput } from '@/components/SliderInput';

interface FarmControls {
  autoMode: boolean;
  laserSystem: boolean;
  pump: boolean;
  startTime: string;
  stopDuration: string;
  solarTracker: boolean;
  soilLimit: number;
}

const Dashboard = () => {
  const [controls, setControls] = useState<FarmControls>({
    autoMode: true,
    laserSystem: false,
    pump: false,
    startTime: '20:17',
    stopDuration: '00:01',
    solarTracker: false,
    soilLimit: 45,
  });
  const [sensorData, setSensorData] = useState({
    temperature: 28.5,
    humidity: 65,
    soilMoisture: 45,
  });
  const [predictedCrop, setPredictedCrop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      } else {
        setLoading(false);
        
        // Listen to Firebase changes
        const controlsRef = ref(database, 'SMART_FARM/controls');
        const sensorsRef = ref(database, 'SMART_FARM/sensors');
        
        onValue(controlsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) setControls(data);
        });
        
        onValue(sensorsRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setSensorData(prev => ({
              temperature: data.temperature ?? prev.temperature,
              humidity: data.humidity ?? prev.humidity,
              soilMoisture: data.soilMoisture ?? prev.soilMoisture,
            }));
          }
        });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const updateControl = async (key: keyof FarmControls, value: any) => {
    try {
      let newControls = { ...controls, [key]: value };
      
      // Ensure only one of autoMode or pump can be active at a time
      if (key === 'autoMode' && value === true) {
        newControls.pump = false;
      } else if (key === 'pump' && value === true) {
        newControls.autoMode = false;
      }
      
      setControls(newControls);
      
      await set(ref(database, 'SMART_FARM/controls'), newControls);
      toast({
        title: t('changesSaved'),
        description: `${key} updated successfully`,
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to update control',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Logout failed',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <LoadingAnimation />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-card border-b border-border shadow-[var(--shadow-card)] sticky top-0 z-50 backdrop-blur-sm bg-card/95"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sprout className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('appTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('sensorData')}</h2>
          <p className="text-muted-foreground">Real-time monitoring</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SensorGauge label={t('temperature')} value={sensorData.temperature} max={50} unit="°C" icon={<Thermometer />} color="hsl(var(--primary))" />
          <SensorGauge label={t('humidity')} value={sensorData.humidity} max={100} unit="%" icon={<Droplet />} color="hsl(var(--accent))" />
          <SensorGauge label={t('soilMoisture')} value={sensorData.soilMoisture} max={100} unit="%" icon={<Droplets />} color="#10b981" />
        </div>

        <CropPredictor sensorData={sensorData} onPrediction={setPredictedCrop} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('controls')}</h2>
          <p className="text-muted-foreground">Manage your farm systems</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mb-12">
          {/* Solar Tracker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ControlToggle
              label="Solar Tracker"
              description="Manually control solar panel tracking"
              checked={controls.solarTracker}
              onChange={(checked) => updateControl('solarTracker', checked)}
              icon={<Sun className="w-6 h-6" />}
            />
          </motion.div>

          {/* Soil Moisture Limit */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SliderInput
              label="Soil Moisture Limit"
              description="Set threshold for field irrigation"
              value={controls.soilLimit}
              onChange={(value) => updateControl('soilLimit', value)}
              min={0}
              max={100}
              step={1}
              unit="%"
            />
          </motion.div>

          {/* Auto Mode */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ControlToggle
              label={t('autoMode')}
              description={t('autoModeDesc')}
              checked={controls.autoMode}
              onChange={(checked) => updateControl('autoMode', checked)}
              icon={<Power className="w-6 h-6" />}
            />
          </motion.div>

          {/* Laser System */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ControlToggle
              label={t('laserSystem')}
              description={t('laserSystemDesc')}
              checked={controls.laserSystem}
              onChange={(checked) => updateControl('laserSystem', checked)}
              icon={<Zap className="w-6 h-6" />}
            />
          </motion.div>

          {/* Pump */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ControlToggle
              label={t('pump')}
              description={t('pumpDesc')}
              checked={controls.pump}
              onChange={(checked) => updateControl('pump', checked)}
              icon={<Droplets className="w-6 h-6" />}
            />
          </motion.div>

          {/* Start Time */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <TimeInput
              label={t('startTime')}
              description={t('startTimeDesc')}
              value={controls.startTime}
              onChange={(value) => updateControl('startTime', value)}
            />
          </motion.div>

          {/* Stop Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="md:col-span-2"
          >
            <DurationInput
              label={t('stopDuration')}
              description={t('stopDurationDesc')}
              value={controls.stopDuration}
              onChange={(value) => updateControl('stopDuration', value)}
            />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Web Viewer</h2>
          <p className="text-muted-foreground">Browse external resources</p>
        </motion.div>

        <WebpageViewer />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('smartFarmGuide')}</h2>
          <p className="text-muted-foreground">{t('aiPoweredGuidance')}</p>
        </motion.div>

        <SmartFarmGuide sensorData={sensorData} predictedCrop={predictedCrop} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('insurance.title')}</h2>
          <p className="text-muted-foreground">{t('insurance.description')}</p>
        </motion.div>

        <InsuranceAdvice />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('prices.title')}</h2>
          <p className="text-muted-foreground">{t('prices.description')}</p>
        </motion.div>

        <CropPrices />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('weatherForecast')}</h2>
          <p className="text-muted-foreground">Real-time weather updates</p>
        </motion.div>

        <WeatherForecast />
      </main>
      
      <ChatBot sensorData={sensorData} predictedCrop={predictedCrop} />
    </div>
  );
};

export default Dashboard;
