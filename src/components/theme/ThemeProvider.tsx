"use client";

import React, { useMemo } from "react";
import {
  QuizTheme,
  DEFAULT_THEME,
  BORDER_RADIUS_MAP,
  SHADOW_MAP,
} from "@/types/theme";

interface ThemeProviderProps {
  theme: QuizTheme | null;
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function ThemeProvider({ theme, children, className, fullHeight = true }: ThemeProviderProps) {
  const effectiveTheme = theme || DEFAULT_THEME;

  // Generate CSS custom properties from theme
  const cssVariables = useMemo(() => {
    return {
      // Theme-specific variables
      "--theme-primary": effectiveTheme.colors.primary,
      "--theme-primary-foreground": effectiveTheme.colors.primaryForeground,
      "--theme-background": effectiveTheme.colors.background,
      "--theme-foreground": effectiveTheme.colors.foreground,
      "--theme-card": effectiveTheme.colors.card,
      "--theme-card-foreground": effectiveTheme.colors.cardForeground,

      // Also override Tailwind CSS variables for automatic styling
      "--primary": effectiveTheme.colors.primary,
      "--primary-foreground": effectiveTheme.colors.primaryForeground,
      "--background": effectiveTheme.colors.background,
      "--foreground": effectiveTheme.colors.foreground,
      "--card": effectiveTheme.colors.card,
      "--card-foreground": effectiveTheme.colors.cardForeground,

      // Answer colors
      "--theme-answer-a": effectiveTheme.answerColors.a,
      "--theme-answer-b": effectiveTheme.answerColors.b,
      "--theme-answer-c": effectiveTheme.answerColors.c,
      "--theme-answer-d": effectiveTheme.answerColors.d,
      "--theme-answer-e": effectiveTheme.answerColors.e,
      "--theme-answer-f": effectiveTheme.answerColors.f,

      // Selected answer
      "--theme-selected-ring": effectiveTheme.selectedAnswer.ringColor,
      "--theme-selected-ring-width": effectiveTheme.selectedAnswer.ringWidth,
      "--theme-selected-scale": effectiveTheme.selectedAnswer.scale,
      "--theme-selected-glow": effectiveTheme.selectedAnswer.glow,

      // Gradients
      "--theme-gradient-page": effectiveTheme.gradients.pageBackground,
      "--theme-gradient-section": effectiveTheme.gradients.sectionSlide,
      "--theme-gradient-correct": effectiveTheme.gradients.correctAnswer,
      "--theme-gradient-wrong": effectiveTheme.gradients.wrongAnswer,

      // Effects
      "--theme-radius": BORDER_RADIUS_MAP[effectiveTheme.effects.borderRadius],
      "--theme-shadow": SHADOW_MAP[effectiveTheme.effects.shadow],
    } as React.CSSProperties;
  }, [effectiveTheme]);

  // Generate animation styles
  const animationStyles = useMemo(() => {
    const styles: string[] = [];

    // Question enter animation
    styles.push(getAnimationCSS("question-enter", effectiveTheme.animations.questionEnter));

    // Answer reveal animation
    styles.push(getAnimationCSS("answer-reveal", effectiveTheme.animations.answerReveal));

    // Scoreboard entry animation
    styles.push(getAnimationCSS("scoreboard-entry", effectiveTheme.animations.scoreboardEntry));

    // Timer warning animation
    styles.push(getAnimationCSS("timer-warning", effectiveTheme.animations.timerWarning));

    // Custom CSS animations
    if (effectiveTheme.customCSS?.backgroundAnimation) {
      styles.push(effectiveTheme.customCSS.backgroundAnimation);
    }
    if (effectiveTheme.customCSS?.celebrationAnimation) {
      styles.push(effectiveTheme.customCSS.celebrationAnimation);
    }

    return styles.join("\n");
  }, [effectiveTheme]);

  // Generate additional CSS to ensure theme colors apply
  const themeCSS = useMemo(() => {
    if (!effectiveTheme?.colors) return '';

    return `
      .theme-root {
        color: hsl(${effectiveTheme.colors.foreground});
      }
      .theme-root .text-primary {
        color: hsl(${effectiveTheme.colors.primary}) !important;
      }
      .theme-root .text-foreground {
        color: hsl(${effectiveTheme.colors.foreground}) !important;
      }
      .theme-root .text-muted-foreground {
        color: hsl(${effectiveTheme.colors.foreground} / 0.6) !important;
      }
      .theme-root .bg-card {
        background-color: hsl(${effectiveTheme.colors.card}) !important;
      }
      .theme-root .text-card-foreground {
        color: hsl(${effectiveTheme.colors.cardForeground}) !important;
      }
    `;
  }, [effectiveTheme]);

  const containerClasses = useMemo(() => {
    return ["theme-root", fullHeight ? "min-h-screen" : "", className]
      .filter(Boolean)
      .join(" ");
  }, [className, fullHeight]);

  return (
    <div
      className={containerClasses}
      style={{
        ...cssVariables,
        background: effectiveTheme.gradients?.pageBackground,
        color: effectiveTheme.colors?.foreground ? `hsl(${effectiveTheme.colors.foreground})` : undefined,
        minHeight: fullHeight ? "100vh" : "auto",
      }}
      data-theme-blur={effectiveTheme.effects?.blur}
      data-celebration={effectiveTheme.animations?.correctCelebration}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles + "\n" + themeCSS }} />
      {children}
    </div>
  );
}

// Helper function to generate animation CSS
function getAnimationCSS(name: string, type: string): string {
  const keyframes: Record<string, string> = {
    none: "",
    fade: `
      @keyframes theme-${name}-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-fade 0.4s ease-out; }
    `,
    "slide-up": `
      @keyframes theme-${name}-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-slide-up 0.5s ease-out; }
    `,
    "slide-down": `
      @keyframes theme-${name}-slide-down {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-slide-down 0.5s ease-out; }
    `,
    "slide-left": `
      @keyframes theme-${name}-slide-left {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-slide-left 0.5s ease-out; }
    `,
    "slide-right": `
      @keyframes theme-${name}-slide-right {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-slide-right 0.5s ease-out; }
    `,
    scale: `
      @keyframes theme-${name}-scale {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-scale 0.4s ease-out; }
    `,
    bounce: `
      @keyframes theme-${name}-bounce {
        0% { transform: scale(0.3); opacity: 0; }
        50% { transform: scale(1.05); }
        70% { transform: scale(0.9); }
        100% { transform: scale(1); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-bounce 0.6s ease-out; }
    `,
    shake: `
      @keyframes theme-${name}-shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .theme-${name} { animation: theme-${name}-shake 0.5s ease-in-out; }
    `,
    pulse: `
      @keyframes theme-${name}-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .theme-${name} { animation: theme-${name}-pulse 0.8s ease-in-out infinite; }
    `,
    flip: `
      @keyframes theme-${name}-flip {
        from { transform: perspective(400px) rotateY(90deg); opacity: 0; }
        to { transform: perspective(400px) rotateY(0deg); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-flip 0.6s ease-out; }
    `,
    rotate: `
      @keyframes theme-${name}-rotate {
        from { transform: rotate(-180deg) scale(0); opacity: 0; }
        to { transform: rotate(0deg) scale(1); opacity: 1; }
      }
      .theme-${name} { animation: theme-${name}-rotate 0.5s ease-out; }
    `,
  };

  return keyframes[type] || "";
}

// Export theme utility functions
export function getAnswerColor(theme: QuizTheme | null, index: number): string {
  const effectiveTheme = theme || DEFAULT_THEME;
  const colorKeys = ["a", "b", "c", "d", "e", "f"] as const;
  const key = colorKeys[index % colorKeys.length];
  return effectiveTheme.answerColors[key];
}

export function getSelectedAnswerStyle(
  theme: QuizTheme | null,
  isSelected: boolean
): React.CSSProperties {
  if (!isSelected) return {};

  const effectiveTheme = theme || DEFAULT_THEME;
  return {
    boxShadow: `0 0 0 ${effectiveTheme.selectedAnswer.ringWidth} ${effectiveTheme.selectedAnswer.ringColor}, ${effectiveTheme.selectedAnswer.glow}`,
    transform: `scale(${effectiveTheme.selectedAnswer.scale})`,
  };
}
