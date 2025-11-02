import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Droplets } from "lucide-react";
import { motion } from "framer-motion";

interface SliderInputProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export const SliderInput = ({ 
  label, 
  description, 
  value, 
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "%"
}: SliderInputProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-lg font-semibold text-foreground">
                  {label}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">
              {value}{unit}
            </div>
          </div>
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
        </div>
      </Card>
    </motion.div>
  );
};
