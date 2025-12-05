import { QuizTheme } from "@/types/theme";

// Festive/Christmas theme with snow
export const FESTIVE_THEME: QuizTheme = {
  name: "Festive",
  version: "1.0",
  colors: {
    primary: "0 72% 62%", // Red (lighter for better contrast)
    primaryForeground: "0 0% 100%",
    background: "150 50% 10%", // Dark green
    foreground: "0 0% 98%",
    card: "150 40% 15%",
    cardForeground: "0 0% 98%",
  },
  answerColors: {
    a: "#DC2626", // Red
    b: "#16A34A", // Green
    c: "#FBBF24", // Gold
    d: "#EF4444", // Light red
    e: "#22C55E", // Light green
    f: "#F59E0B", // Amber
  },
  selectedAnswer: {
    ringColor: "#FBBF24",
    ringWidth: "4px",
    scale: 1.05,
    glow: "0 0 25px rgba(251, 191, 36, 0.6)",
  },
  gradients: {
    pageBackground: "linear-gradient(180deg, #0F2417 0%, #1A3A28 50%, #0D1F14 100%)",
    sectionSlide: "linear-gradient(135deg, #DC2626 0%, #16A34A 100%)",
    correctAnswer: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
    wrongAnswer: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
  },
  effects: {
    borderRadius: "lg",
    shadow: "lg",
    blur: false,
  },
  animations: {
    questionEnter: "fade",
    answerReveal: "scale",
    correctCelebration: "sparkle",
    timerWarning: "pulse",
    scoreboardEntry: "slide-up",
  },
  customCSS: {
    backgroundAnimation: `
      @keyframes snowfall {
        0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh) translateX(20px) rotate(360deg); opacity: 0; }
      }
    `,
  },
};

// Space theme with stars
export const SPACE_THEME: QuizTheme = {
  name: "Space",
  version: "1.0",
  colors: {
    primary: "250 100% 70%", // Electric blue (lighter for better contrast)
    primaryForeground: "0 0% 100%",
    background: "240 20% 4%", // Near black
    foreground: "0 0% 95%",
    card: "240 20% 8%",
    cardForeground: "0 0% 95%",
  },
  answerColors: {
    a: "#7C3AED", // Purple
    b: "#3B82F6", // Blue
    c: "#06B6D4", // Cyan
    d: "#8B5CF6", // Violet
    e: "#2563EB", // Royal blue
    f: "#0EA5E9", // Sky blue
  },
  selectedAnswer: {
    ringColor: "#A78BFA",
    ringWidth: "4px",
    scale: 1.05,
    glow: "0 0 30px rgba(167, 139, 250, 0.7)",
  },
  gradients: {
    pageBackground: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 50%, #0c0c1e 100%)",
    sectionSlide: "linear-gradient(135deg, #4C1D95 0%, #1E40AF 100%)",
    correctAnswer: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    wrongAnswer: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  },
  effects: {
    borderRadius: "xl",
    shadow: "lg",
    blur: true,
  },
  animations: {
    questionEnter: "scale",
    answerReveal: "fade",
    correctCelebration: "sparkle",
    timerWarning: "pulse",
    scoreboardEntry: "slide-up",
  },
  customCSS: {
    backgroundAnimation: `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
    `,
  },
};

// Ocean theme with bubbles
export const OCEAN_THEME: QuizTheme = {
  name: "Ocean",
  version: "1.0",
  colors: {
    primary: "200 90% 40%", // Ocean blue (darker for better contrast)
    primaryForeground: "0 0% 100%",
    background: "200 50% 10%", // Deep sea
    foreground: "0 0% 98%",
    card: "200 40% 15%",
    cardForeground: "0 0% 98%",
  },
  answerColors: {
    a: "#0EA5E9", // Sky blue
    b: "#06B6D4", // Cyan
    c: "#14B8A6", // Teal
    d: "#22D3EE", // Light cyan
    e: "#38BDF8", // Light blue
    f: "#2DD4BF", // Turquoise
  },
  selectedAnswer: {
    ringColor: "#67E8F9",
    ringWidth: "4px",
    scale: 1.05,
    glow: "0 0 25px rgba(103, 232, 249, 0.6)",
  },
  gradients: {
    pageBackground: "linear-gradient(180deg, #0C4A6E 0%, #164E63 50%, #083344 100%)",
    sectionSlide: "linear-gradient(135deg, #0369A1 0%, #0E7490 100%)",
    correctAnswer: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)",
    wrongAnswer: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
  },
  effects: {
    borderRadius: "xl",
    shadow: "md",
    blur: true,
  },
  animations: {
    questionEnter: "slide-up",
    answerReveal: "scale",
    correctCelebration: "glow",
    timerWarning: "shake",
    scoreboardEntry: "slide-up",
  },
  customCSS: {
    backgroundAnimation: `
      @keyframes bubble {
        0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
        10% { opacity: 0.6; }
        100% { transform: translateY(-10vh) scale(1); opacity: 0; }
      }
    `,
  },
};

// Sunset theme with warm colors
export const SUNSET_THEME: QuizTheme = {
  name: "Sunset",
  version: "1.0",
  colors: {
    primary: "25 95% 45%", // Orange (darker for better contrast)
    primaryForeground: "0 0% 100%",
    background: "15 30% 8%", // Dark warm
    foreground: "0 0% 98%",
    card: "15 25% 12%",
    cardForeground: "0 0% 98%",
  },
  answerColors: {
    a: "#F97316", // Orange
    b: "#EF4444", // Red
    c: "#F59E0B", // Amber
    d: "#EC4899", // Pink
    e: "#FB923C", // Light orange
    f: "#FBBF24", // Yellow
  },
  selectedAnswer: {
    ringColor: "#FCD34D",
    ringWidth: "4px",
    scale: 1.05,
    glow: "0 0 25px rgba(252, 211, 77, 0.6)",
  },
  gradients: {
    pageBackground: "linear-gradient(180deg, #431407 0%, #7C2D12 30%, #9A3412 60%, #1C1917 100%)",
    sectionSlide: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
    correctAnswer: "linear-gradient(135deg, #84CC16 0%, #65A30D 100%)",
    wrongAnswer: "linear-gradient(135deg, #BE123C 0%, #9F1239 100%)",
  },
  effects: {
    borderRadius: "lg",
    shadow: "lg",
    blur: false,
  },
  animations: {
    questionEnter: "fade",
    answerReveal: "scale",
    correctCelebration: "glow",
    timerWarning: "pulse",
    scoreboardEntry: "slide-up",
  },
};

// Neon Arcade theme
export const NEON_THEME: QuizTheme = {
  name: "Neon Arcade",
  version: "1.0",
  colors: {
    primary: "320 100% 50%", // Magenta
    primaryForeground: "0 0% 100%",
    background: "0 0% 5%", // Pure black
    foreground: "60 100% 50%", // Neon yellow text
    card: "0 0% 8%",
    cardForeground: "180 100% 50%", // Cyan text
  },
  answerColors: {
    a: "#FF0080", // Hot pink
    b: "#00FFFF", // Cyan
    c: "#FFFF00", // Yellow
    d: "#00FF00", // Lime
    e: "#FF00FF", // Magenta
    f: "#FF6600", // Neon orange
  },
  selectedAnswer: {
    ringColor: "#FFFFFF",
    ringWidth: "3px",
    scale: 1.08,
    glow: "0 0 30px rgba(255, 255, 255, 0.8)",
  },
  gradients: {
    pageBackground: "linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)",
    sectionSlide: "linear-gradient(90deg, #FF00FF 0%, #00FFFF 100%)",
    correctAnswer: "linear-gradient(135deg, #00FF00 0%, #00CC00 100%)",
    wrongAnswer: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
  },
  effects: {
    borderRadius: "none",
    shadow: "lg",
    blur: false,
  },
  animations: {
    questionEnter: "scale",
    answerReveal: "flip",
    correctCelebration: "fireworks",
    timerWarning: "shake",
    scoreboardEntry: "bounce",
  },
  customCSS: {
    backgroundAnimation: `
      @keyframes neonPulse {
        0%, 100% { filter: drop-shadow(0 0 5px currentColor); }
        50% { filter: drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor); }
      }
    `,
  },
};

// All presets
export const THEME_PRESETS: Record<string, QuizTheme> = {
  festive: FESTIVE_THEME,
  space: SPACE_THEME,
  ocean: OCEAN_THEME,
  sunset: SUNSET_THEME,
  neon: NEON_THEME,
};

export const PRESET_LIST = [
  { id: "festive", name: "Festive", description: "Christmas colors with snow effect" },
  { id: "space", name: "Space", description: "Dark theme with twinkling stars" },
  { id: "ocean", name: "Ocean", description: "Blue tones with bubble effect" },
  { id: "sunset", name: "Sunset", description: "Warm oranges and pinks" },
  { id: "neon", name: "Neon Arcade", description: "Retro neon colors" },
];
