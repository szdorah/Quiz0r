"use client";

import React from "react";
import { QuizTheme, DEFAULT_THEME, BORDER_RADIUS_MAP } from "@/types/theme";
import { BackgroundEffects } from "@/components/theme/BackgroundEffects";

interface ThemePreviewProps {
  theme: QuizTheme | null;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const t = theme || DEFAULT_THEME;

  return (
    <div className="border rounded-lg overflow-hidden bg-gray-900">
      {/* Preview Header */}
      <div className="p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>

      {/* Preview Content */}
      <div
        className="p-6 min-h-[350px] relative overflow-hidden"
        style={{ background: t.gradients.pageBackground }}
      >
        <BackgroundEffects theme={theme} contained />
        {/* Question Preview */}
        <div className="text-center mb-6 relative z-10">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs mb-2"
            style={{
              backgroundColor: `hsl(${t.colors.primary})`,
              color: `hsl(${t.colors.primaryForeground})`,
            }}
          >
            Question 1 of 10
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: `hsl(${t.colors.foreground})` }}
          >
            What is the capital of France?
          </h2>

          {/* Timer Bar */}
          <div className="max-w-xs mx-auto h-2 rounded-full overflow-hidden bg-white/20">
            <div
              className="h-full w-3/4 rounded-full transition-all"
              style={{ backgroundColor: `hsl(${t.colors.primary})` }}
            />
          </div>
        </div>

        {/* Answer Buttons Preview */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto relative z-10">
          {["Paris", "London", "Berlin", "Madrid"].map((answer, i) => {
            const colorKey = ["a", "b", "c", "d"][i] as keyof typeof t.answerColors;
            const isSelected = i === 0;

            return (
              <div
                key={answer}
                className="p-3 text-white text-center font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: t.answerColors[colorKey],
                  borderRadius: BORDER_RADIUS_MAP[t.effects.borderRadius],
                  boxShadow: isSelected
                    ? `0 0 0 ${t.selectedAnswer.ringWidth} ${t.selectedAnswer.ringColor}, ${t.selectedAnswer.glow}`
                    : undefined,
                  transform: isSelected ? `scale(${t.selectedAnswer.scale})` : undefined,
                }}
              >
                {answer}
              </div>
            );
          })}
        </div>

        {/* Selected indicator */}
        <p
          className="text-center text-xs mt-4 opacity-60"
          style={{ color: `hsl(${t.colors.foreground})` }}
        >
          &quot;Paris&quot; is selected (showing selection style)
        </p>
      </div>

      {/* Section Slide Preview */}
      <div
        className="p-4 text-white text-center"
        style={{ background: t.gradients.sectionSlide }}
      >
        <h3 className="font-bold text-lg">Round 2: Geography</h3>
        <p className="text-sm opacity-80">5 questions</p>
      </div>

      {/* Color Swatches */}
      <div className="p-3 bg-gray-800 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Answer Colors</div>
        <div className="flex gap-2">
          {["a", "b", "c", "d", "e", "f"].map((key) => (
            <div
              key={key}
              className="w-8 h-8 rounded-lg"
              style={{
                backgroundColor: t.answerColors[key as keyof typeof t.answerColors],
              }}
              title={`Answer ${key.toUpperCase()}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mini preview for preset selection
export function ThemePreviewMini({ theme }: ThemePreviewProps) {
  const t = theme || DEFAULT_THEME;

  return (
    <div
      className="w-full h-24 rounded-lg overflow-hidden relative"
      style={{ background: t.gradients.pageBackground }}
    >
      {/* Mini answer buttons */}
      <div className="absolute inset-2 grid grid-cols-2 gap-1">
        {["a", "b", "c", "d"].map((key) => (
          <div
            key={key}
            className="rounded"
            style={{
              backgroundColor: t.answerColors[key as keyof typeof t.answerColors],
            }}
          />
        ))}
      </div>
    </div>
  );
}
