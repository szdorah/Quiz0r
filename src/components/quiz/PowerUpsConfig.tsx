"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, AlertCircle } from "lucide-react";

interface PowerUpsConfigProps {
  hintCount: number;
  copyAnswerCount: number;
  doublePointsCount: number;
  onUpdate: (field: string, value: number) => void;
}

export function PowerUpsConfig({
  hintCount,
  copyAnswerCount,
  doublePointsCount,
  onUpdate,
}: PowerUpsConfigProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Zap className="w-4 h-4" />
          Power-ups
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configure power-ups available to players. Set to 0 to disable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hint Power-up */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="hint-count" className="text-sm">💡 Hint</Label>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Shows a hint for the question
            </p>
          </div>
          <Input
            id="hint-count"
            type="number"
            min="0"
            max="10"
            className="w-16 sm:w-20"
            value={hintCount}
            onChange={(e) => onUpdate("hintCount", parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Copy Answer Power-up */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="copy-count" className="text-sm">👥 Copy Answer</Label>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Copy another player's answer (blind)
            </p>
          </div>
          <Input
            id="copy-count"
            type="number"
            min="0"
            max="10"
            className="w-16 sm:w-20"
            value={copyAnswerCount}
            onChange={(e) => onUpdate("copyAnswerCount", parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Double Points Power-up */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="double-count" className="text-sm">⚡ Double Points</Label>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Doubles the final score
            </p>
          </div>
          <Input
            id="double-count"
            type="number"
            min="0"
            max="10"
            className="w-16 sm:w-20"
            value={doublePointsCount}
            onChange={(e) => onUpdate("doublePointsCount", parseInt(e.target.value) || 0)}
          />
        </div>

        {hintCount > 0 && (
          <div className="flex items-start gap-2 p-2 sm:p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
                Hint Required
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 hidden sm:block">
                All questions must have a hint when enabled.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
