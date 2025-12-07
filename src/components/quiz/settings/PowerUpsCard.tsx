"use client";

import { Zap, Lightbulb, Users, Sparkles, Minus, Plus, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PowerUpsCardProps {
  hintCount: number;
  copyAnswerCount: number;
  doublePointsCount: number;
  questionsWithoutHints: number;
  onUpdatePowerUp: (field: string, value: number) => void;
}

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function Stepper({ value, onChange, min = 0, max = 10 }: StepperProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className="w-8 text-center text-sm font-medium tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}

export function PowerUpsCard({
  hintCount,
  copyAnswerCount,
  doublePointsCount,
  questionsWithoutHints,
  onUpdatePowerUp,
}: PowerUpsCardProps) {
  const showHintWarning = hintCount > 0 && questionsWithoutHints > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Zap className="w-4 h-4" />
        Power-ups
      </div>

      <div className="space-y-3">
        {/* Hint Power-up */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
            <Label className="text-sm font-normal truncate">Hint</Label>
          </div>
          <Stepper
            value={hintCount}
            onChange={(v) => onUpdatePowerUp("hintCount", v)}
          />
        </div>

        {/* Copy Answer Power-up */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Users className="w-4 h-4 text-purple-500 shrink-0" />
            <Label className="text-sm font-normal truncate">Copy Answer</Label>
          </div>
          <Stepper
            value={copyAnswerCount}
            onChange={(v) => onUpdatePowerUp("copyAnswerCount", v)}
          />
        </div>

        {/* Double Points Power-up */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <Label className="text-sm font-normal truncate">Double Points</Label>
          </div>
          <Stepper
            value={doublePointsCount}
            onChange={(v) => onUpdatePowerUp("doublePointsCount", v)}
          />
        </div>
      </div>

      {/* Hint Warning */}
      {showHintWarning && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {questionsWithoutHints} question{questionsWithoutHints !== 1 ? "s" : ""} need hints
          </p>
        </div>
      )}
    </div>
  );
}
