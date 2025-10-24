import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ControlToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
}

export const ControlToggle = ({ label, description, checked, onChange, icon }: ControlToggleProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <motion.div
              animate={{
                scale: checked ? [1, 1.2, 1] : 1,
                rotate: checked ? [0, 10, -10, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
              className="text-primary"
            >
              {icon}
            </motion.div>
            <div className="flex-1">
              <Label htmlFor={label} className="text-lg font-semibold text-foreground cursor-pointer">
                {label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-2 text-xs font-medium ${checked ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}
              >
                {checked ? '● Active' : '○ Inactive'}
              </motion.div>
            </div>
          </div>
          <Switch
            id={label}
            checked={checked}
            onCheckedChange={onChange}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </Card>
    </motion.div>
  );
};
