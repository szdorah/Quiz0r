import { Progress } from "@/components/ui/progress";
import { PasswordStrength } from "@/types/settings-export";

interface PasswordStrengthIndicatorProps {
  strength: PasswordStrength;
}

export function PasswordStrengthIndicator({
  strength,
}: PasswordStrengthIndicatorProps) {
  const colors = {
    0: "bg-gray-300",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-green-500",
  };

  const labels = {
    0: "Too short",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  return (
    <div className="space-y-2">
      <Progress
        value={(strength.score / 4) * 100}
        className={colors[strength.score]}
      />
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{labels[strength.score]}</span>
        <span className="text-muted-foreground">{strength.feedback[0]}</span>
      </div>
    </div>
  );
}
