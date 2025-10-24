import { motion } from "framer-motion";
import { Sprout, Droplets } from "lucide-react";

export const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Plant Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Sprout className="w-16 h-16 text-primary" />
        </motion.div>

        {/* Animated Water Droplets */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            >
              <Droplets className="w-6 h-6 text-primary" />
            </motion.div>
          ))}
        </div>

        {/* Loading Text */}
        <motion.p
          className="text-muted-foreground text-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Smart Farm Dashboard...
        </motion.p>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ x: [-256, 256] }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ width: '50%' }}
          />
        </div>
      </div>
    </div>
  );
};
