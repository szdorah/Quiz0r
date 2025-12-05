// Quiz Theme Types

export interface QuizTheme {
  // Metadata
  name: string;
  version: "1.0";

  // Color Palette (HSL format for consistency with Tailwind CSS)
  colors: {
    primary: string;           // Main accent color, e.g., "265 91% 57%"
    primaryForeground: string; // Text on primary, e.g., "0 0% 100%"
    background: string;        // Page background
    foreground: string;        // Main text color
    card: string;              // Card background
    cardForeground: string;    // Card text
  };

  // Answer Button Colors (6 colors for up to 6 answers)
  answerColors: {
    a: string; // Answer A background, e.g., "#EF4444" (red)
    b: string; // Answer B background, e.g., "#3B82F6" (blue)
    c: string; // Answer C background, e.g., "#EAB308" (yellow)
    d: string; // Answer D background, e.g., "#22C55E" (green)
    e: string; // Answer E background, e.g., "#A855F7" (purple)
    f: string; // Answer F background, e.g., "#F97316" (orange)
  };

  // Selected Answer Styling (for multi-select visibility)
  selectedAnswer: {
    ringColor: string;  // Ring color around selected answers
    ringWidth: string;  // Ring width, e.g., "4px"
    scale: number;      // Scale factor, e.g., 1.02
    glow: string;       // Box-shadow for glow effect
  };

  // Gradient Definitions
  gradients: {
    pageBackground: string;   // Main page gradient
    sectionSlide: string;     // Section divider background
    correctAnswer: string;    // Shown when revealing correct
    wrongAnswer: string;      // Shown when revealing wrong
  };

  // Visual Effects
  effects: {
    borderRadius: "none" | "sm" | "md" | "lg" | "xl";
    shadow: "none" | "sm" | "md" | "lg" | "xl";
    blur: boolean; // Glassmorphism effect
  };

  // Animations (predefined safe animations)
  animations: {
    questionEnter: AnimationType;
    answerReveal: AnimationType;
    correctCelebration: CelebrationType;
    timerWarning: AnimationType;
    scoreboardEntry: AnimationType;
  };

  // Custom CSS (AI-generated animations)
  customCSS?: {
    backgroundAnimation?: string; // CSS for background effect
    celebrationAnimation?: string; // CSS for celebration effect
  };
}

// Animation types - predefined for safety
export type AnimationType =
  | "none"
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "bounce"
  | "shake"
  | "pulse"
  | "flip"
  | "rotate";

export type CelebrationType =
  | "none"
  | "confetti"
  | "sparkle"
  | "glow"
  | "fireworks";

// Default theme (current app styling)
export const DEFAULT_THEME: QuizTheme = {
  name: "Default",
  version: "1.0",
  colors: {
    primary: "0 0% 95%",
    primaryForeground: "0 0% 20%",
    background: "0 0% 20%",
    foreground: "0 0% 95%",
    card: "0 0% 25%",
    cardForeground: "0 0% 95%",
  },
  answerColors: {
    a: "#EF4444",
    b: "#3B82F6",
    c: "#EAB308",
    d: "#22C55E",
    e: "#A855F7",
    f: "#F97316",
  },
  selectedAnswer: {
    ringColor: "#FFFFFF",
    ringWidth: "4px",
    scale: 1.05,
    glow: "0 0 20px rgba(255,255,255,0.5)",
  },
  gradients: {
    pageBackground:
      "linear-gradient(135deg, hsl(0 0% 25%) 0%, hsl(0 0% 15%) 100%)",
    sectionSlide: "linear-gradient(135deg, hsl(0 0% 35%) 0%, hsl(0 0% 25%) 100%)",
    correctAnswer: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
    wrongAnswer: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  },
  effects: {
    borderRadius: "lg",
    shadow: "md",
    blur: false,
  },
  animations: {
    questionEnter: "fade",
    answerReveal: "scale",
    correctCelebration: "confetti",
    timerWarning: "pulse",
    scoreboardEntry: "slide-up",
  },
};

// Border radius mapping
export const BORDER_RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
};

// Shadow mapping
export const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
};
