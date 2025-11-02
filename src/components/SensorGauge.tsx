import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface SensorGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export const SensorGauge = ({ label, value, max, unit, icon, color }: SensorGaugeProps) => {
  const safeValue = value ?? 0;
  const percentage = Math.min((safeValue / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="w-full"
    >
      <Card className="p-4 sm:p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 h-full">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <h3 className="text-xs sm:text-sm font-semibold truncate max-w-full">{label}</h3>
          </div>
          
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 128 128">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="45"
                stroke={color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeInOut" }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
              <motion.span
                className="text-2xl sm:text-3xl font-bold text-foreground leading-none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {safeValue.toFixed(1)}
              </motion.span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-1">{unit}</span>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
