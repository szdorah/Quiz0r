"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { QuizTheme, DEFAULT_THEME, BORDER_RADIUS_MAP, SHADOW_MAP } from "@/types/theme";
import { ThemeProvider, getSelectedAnswerStyle } from "@/components/theme/ThemeProvider";
import { BackgroundEffects } from "@/components/theme/BackgroundEffects";
import { Progress } from "@/components/ui/progress";
import { getContrastingTextColor } from "@/lib/color-utils";
import { Check, X } from "lucide-react";

interface ThemePreviewProps {
  theme: QuizTheme | null;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const displayTheme = theme || DEFAULT_THEME;

  const sampleQuestion = {
    questionText: "What is the capital of France?",
    answers: ["Paris", "Madrid", "Berlin", "Rome"],
    timeLimit: 12,
  };
  const revealState = {
    correctIndex: 0,
    selectedWrongIndex: 1,
    answerCounts: [8, 3, 1, 0],
  };

  const [timeLeft, setTimeLeft] = useState(sampleQuestion.timeLimit);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return sampleQuestion.timeLimit;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timerPercent = useMemo(() => (timeLeft / sampleQuestion.timeLimit) * 100, [timeLeft, sampleQuestion.timeLimit]);

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-background">
      <ThemeProvider
        theme={displayTheme}
        fullHeight={false}
        className="relative p-6 space-y-6"
      >
        <BackgroundEffects theme={displayTheme} contained />

        <div className="relative z-10 space-y-6" key={displayTheme.name}>
          {/* Header row - mirrors display screen */}
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="bg-primary text-primary-foreground text-sm md:text-base lg:text-lg font-bold px-3 py-1 rounded-full">
              Question 1 of 10
            </span>
            <div className="flex items-center gap-2 theme-timer-warning">
              <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                {timeLeft}
              </span>
              <span className="text-sm md:text-base text-muted-foreground">seconds</span>
            </div>
          </div>

          {/* Timer bar */}
          <div className="theme-preview-progress">
            <Progress value={timerPercent} className="h-2 mb-4" />
          </div>

          {/* Question + answers */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 theme-question-enter">
                {sampleQuestion.questionText}
              </h2>
            </div>

            {/* Active question (in-progress) */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {sampleQuestion.answers.map((answer, index) => {
                  const key = ["a", "b", "c", "d", "e", "f"][index] as keyof QuizTheme["answerColors"];
                  const answerColor = displayTheme.answerColors[key];
                  const textColor = getContrastingTextColor(answerColor);
                  const isSelected = index === 1; // simulate a selection
                  const selectedStyle = isSelected ? getSelectedAnswerStyle(displayTheme, true) : {};

                  return (
                    <div
                      key={answer}
                      className="p-4 md:p-5 lg:p-6 relative overflow-hidden transition-all duration-300 theme-answer-reveal"
                      style={{
                        backgroundColor: answerColor,
                        color: `hsl(${textColor})`,
                        borderRadius: BORDER_RADIUS_MAP[displayTheme.effects.borderRadius] || "0.75rem",
                        boxShadow: SHADOW_MAP[displayTheme.effects.shadow] || "none",
                        ...selectedStyle,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg md:text-xl lg:text-2xl font-bold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-base md:text-lg lg:text-xl">{answer}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-muted-foreground">
                6 of 12 players answered
              </div>
            </div>

            {/* Reveal state (post-timer) mirrors display screen gradients and dimming */}
            <div className="space-y-2">
              <div className="text-sm uppercase tracking-wide text-muted-foreground">Reveal preview</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {sampleQuestion.answers.map((answer, index) => {
                  let background = displayTheme.answerColors.a;
                  let textColor = "0 0% 100%";
                  const extraStyles: CSSProperties = {};
                  const isCorrect = index === revealState.correctIndex;
                  const wasSelectedWrong = index === revealState.selectedWrongIndex;

                  if (isCorrect) {
                    background = displayTheme.gradients.correctAnswer;
                    textColor = "0 0% 100%";
                    extraStyles.boxShadow = `0 0 0 4px rgba(34, 197, 94, 0.3), ${SHADOW_MAP[displayTheme.effects.shadow] || "none"}`;
                  } else if (wasSelectedWrong) {
                    background = displayTheme.gradients.wrongAnswer;
                    textColor = "0 0% 100%";
                    extraStyles.opacity = 0.6;
                  } else {
                    background = "#9ca3af";
                    textColor = "0 0% 100%";
                    extraStyles.opacity = 0.5;
                  }

                  return (
                    <div
                      key={answer}
                      className="p-4 md:p-5 lg:p-6 relative overflow-hidden transition-all duration-300"
                      style={{
                        background,
                        color: `hsl(${textColor})`,
                        borderRadius: BORDER_RADIUS_MAP[displayTheme.effects.borderRadius] || "0.75rem",
                        boxShadow: SHADOW_MAP[displayTheme.effects.shadow] || "none",
                        ...extraStyles,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg md:text-xl lg:text-2xl font-bold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-base md:text-lg lg:text-xl flex-1">{answer}</span>
                        {isCorrect && <Check className="w-6 h-6 shrink-0" />}
                        {wasSelectedWrong && !isCorrect && <X className="w-6 h-6 shrink-0" />}
                      </div>
                      <div className="mt-2 text-sm opacity-85">
                        {revealState.answerCounts[index]} player{revealState.answerCounts[index] !== 1 ? "s" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}

interface ThemePreviewMiniProps {
  theme: QuizTheme;
}

export function ThemePreviewMini({ theme }: ThemePreviewMiniProps) {
  return (
    <div className="w-full h-20 rounded-md overflow-hidden border">
      <div
        className="h-full p-2 space-y-1"
        style={{
          background: theme.gradients.pageBackground,
        }}
      >
        {/* Mini answer buttons */}
        <div className="grid grid-cols-3 gap-1 h-full">
          {(["a", "b", "c", "d"] as const).map((letter) => (
            <div
              key={letter}
              className="rounded-sm"
              style={{
                backgroundColor:
                  theme.answerColors[letter as keyof typeof theme.answerColors],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
