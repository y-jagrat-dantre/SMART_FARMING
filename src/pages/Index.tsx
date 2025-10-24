import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sprout, Leaf, Droplets } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 opacity-10"
        >
          <Leaf className="w-32 h-32 text-primary" />
        </motion.div>
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-10 opacity-10"
        >
          <Droplets className="w-40 h-40 text-accent" />
        </motion.div>
      </div>

      {/* Header */}
      <header className="absolute top-0 right-0 p-6 z-10">
        <LanguageSwitcher />
      </header>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="inline-block mb-6"
          >
            <Sprout className="w-24 h-24 text-primary mx-auto" />
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            {t('appTitle')}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('manageYourFarm')}
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-semibold px-12 py-6 text-lg shadow-[var(--shadow-glow)]"
            >
              {t('login')}
            </Button>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border"
            >
              <Power className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">{t('autoMode')}</h3>
              <p className="text-sm text-muted-foreground">{t('autoModeDesc')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border"
            >
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">{t('laserSystem')}</h3>
              <p className="text-sm text-muted-foreground">{t('laserSystemDesc')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border"
            >
              <Droplets className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-lg mb-2 text-foreground">{t('pump')}</h3>
              <p className="text-sm text-muted-foreground">{t('pumpDesc')}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Missing imports for feature cards
import { Power, Zap } from 'lucide-react';

export default Index;
