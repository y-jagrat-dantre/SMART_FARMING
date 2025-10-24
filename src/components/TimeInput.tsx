import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

interface TimeInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

export const TimeInput = ({ label, description, value, onChange }: TimeInputProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <Label htmlFor={label} className="text-lg font-semibold text-foreground">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Input
            id={label}
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-lg font-mono bg-background border-input focus:ring-primary"
          />
        </div>
      </Card>
    </motion.div>
  );
};
