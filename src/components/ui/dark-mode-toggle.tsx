"use client";

import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { cn } from "@/lib/utils";

interface DarkModeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function DarkModeToggle({
  showLabel = true,
  className,
}: DarkModeToggleProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sun className="w-4 h-4 text-muted-foreground" />
      <Switch checked={isDark} onCheckedChange={toggle} />
      <Moon className="w-4 h-4 text-muted-foreground" />
      {showLabel && (
        <span className="text-sm text-muted-foreground ml-1">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </div>
  );
}
