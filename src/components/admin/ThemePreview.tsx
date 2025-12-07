import { QuizTheme, DEFAULT_THEME } from "@/types/theme";

interface ThemePreviewProps {
  theme: QuizTheme | null;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  const displayTheme = theme || DEFAULT_THEME;

  return (
    <div className="w-full rounded-lg border overflow-hidden bg-background">
      <div
        className="p-6 space-y-4"
        style={{
          background: displayTheme.gradients.pageBackground,
          color: `hsl(${displayTheme.colors.foreground})`,
        }}
      >
        {/* Question Card Preview */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: `hsl(${displayTheme.colors.card})`,
            color: `hsl(${displayTheme.colors.cardForeground})`,
            borderRadius:
              displayTheme.effects.borderRadius === "none"
                ? "0"
                : displayTheme.effects.borderRadius === "sm"
                  ? "0.25rem"
                  : displayTheme.effects.borderRadius === "md"
                    ? "0.5rem"
                    : displayTheme.effects.borderRadius === "lg"
                      ? "1rem"
                      : "1.5rem",
            boxShadow:
              displayTheme.effects.shadow === "none"
                ? "none"
                : displayTheme.effects.shadow === "sm"
                  ? "0 1px 2px rgba(0, 0, 0, 0.05)"
                  : displayTheme.effects.shadow === "md"
                    ? "0 4px 6px rgba(0, 0, 0, 0.1)"
                    : displayTheme.effects.shadow === "lg"
                      ? "0 10px 15px rgba(0, 0, 0, 0.15)"
                      : "0 20px 25px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h3 className="font-bold text-lg mb-3">Sample Question?</h3>

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {(["a", "b", "c", "d"] as const).map((letter) => (
              <button
                key={letter}
                className="p-3 rounded-lg font-medium text-white text-sm"
                style={{
                  backgroundColor:
                    displayTheme.answerColors[
                      letter as keyof typeof displayTheme.answerColors
                    ],
                }}
              >
                Answer {letter.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Button Preview */}
        <button
          className="px-6 py-2 rounded-lg font-medium"
          style={{
            backgroundColor: `hsl(${displayTheme.colors.primary})`,
            color: `hsl(${displayTheme.colors.primaryForeground})`,
          }}
        >
          Primary Button
        </button>
      </div>
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
