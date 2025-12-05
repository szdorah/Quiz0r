/**
 * Contrast Checker for Theme Colors
 * Ensures WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
 */

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Parse HSL string like "265 91% 57%" to [h, s, l]
function parseHsl(hslString: string): [number, number, number] {
  const parts = hslString.split(/\s+/);
  return [
    parseFloat(parts[0]),
    parseFloat(parts[1]),
    parseFloat(parts[2])
  ];
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(hsl1: string, hsl2: string): number {
  const [h1, s1, l1] = parseHsl(hsl1);
  const [h2, s2, l2] = parseHsl(hsl2);

  const [r1, g1, b1] = hslToRgb(h1, s1, l1);
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);

  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG AA standards
export function meetsWCAG_AA(ratio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Get readable status string
export function getContrastStatus(ratio: number, isLargeText: boolean = false): string {
  const passes = meetsWCAG_AA(ratio, isLargeText);
  return passes ? "✓ Pass" : "✗ Fail";
}

// Analyze a theme's contrast
export interface ThemeContrastAnalysis {
  themeName: string;
  checks: Array<{
    description: string;
    foreground: string;
    background: string;
    ratio: number;
    passes: boolean;
    isLargeText: boolean;
  }>;
  hasIssues: boolean;
}

export function analyzeThemeContrast(theme: {
  name: string;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
  };
}): ThemeContrastAnalysis {
  const checks = [
    {
      description: "Body text (foreground on background)",
      foreground: theme.colors.foreground,
      background: theme.colors.background,
      isLargeText: false,
    },
    {
      description: "Card text (cardForeground on card)",
      foreground: theme.colors.cardForeground,
      background: theme.colors.card,
      isLargeText: false,
    },
    {
      description: "Primary button text (primaryForeground on primary)",
      foreground: theme.colors.primaryForeground,
      background: theme.colors.primary,
      isLargeText: true, // Often used for badges/buttons
    },
    {
      description: "Primary text on page (primary on background) - CRITICAL",
      foreground: theme.colors.primary,
      background: theme.colors.background,
      isLargeText: true, // Used for titles, scores, timers
    },
  ];

  const results = checks.map(check => {
    const ratio = getContrastRatio(check.foreground, check.background);
    const passes = meetsWCAG_AA(ratio, check.isLargeText);

    return {
      ...check,
      ratio: Math.round(ratio * 10) / 10,
      passes,
    };
  });

  return {
    themeName: theme.name,
    checks: results,
    hasIssues: results.some(r => !r.passes),
  };
}
