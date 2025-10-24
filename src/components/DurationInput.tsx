import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

interface DurationInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

export const DurationInput = ({ label, description, value, onChange }: DurationInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Format as HH:MM
    if (val.length <= 5) {
      onChange(val);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-primary" />
            <div>
              <Label htmlFor={label} className="text-lg font-semibold text-foreground">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Input
            id={label}
            type="text"
            value={value}
            onChange={handleChange}
            placeholder="00:00"
            pattern="[0-9]{2}:[0-9]{2}"
            className="text-lg font-mono bg-background border-input focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">Format: HH:MM</p>
        </div>
      </Card>
    </motion.div>
  );
};
