/**
 * Comprehensive Theme Contrast Checker
 * Validates ALL color combinations used in the app
 */

import { DEFAULT_THEME } from "../src/types/theme";
import { THEME_PRESETS } from "../src/lib/theme-presets";
import { analyzeThemeContrast, getContrastRatio, meetsWCAG_AA } from "../src/lib/contrast-checker";
import { getContrastingTextColor } from "../src/lib/color-utils";

console.log("========================================");
console.log("COMPREHENSIVE THEME CONTRAST AUDIT");
console.log("WCAG AA: 4.5:1 (normal), 3:1 (large text)");
console.log("========================================\n");

interface ExtendedCheck {
  description: string;
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
  isLargeText: boolean;
  location: string;
}

function hexToHsl(hex: string): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function checkAnswerButtonContrast(theme: any): ExtendedCheck[] {
  const checks: ExtendedCheck[] = [];

  // Check dynamic contrasting text on each answer color
  const answerKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
  answerKeys.forEach((key, index) => {
    const bgColor = theme.answerColors[key];
    const bgHsl = hexToHsl(bgColor);

    // Get the dynamically calculated text color (same as implementation)
    const textColor = getContrastingTextColor(bgColor);
    const ratio = getContrastRatio(textColor, bgHsl);
    const passes = meetsWCAG_AA(ratio, true); // Large text (buttons)

    const textColorDisplay = textColor === "0 0% 10%" ? "black" : "white";
    checks.push({
      description: `Answer ${key.toUpperCase()} button (${textColorDisplay} on ${bgColor})`,
      foreground: textColor,
      background: bgHsl,
      ratio: Math.round(ratio * 10) / 10,
      passes,
      isLargeText: true,
      location: "Display & Play pages - Answer buttons"
    });
  });

  return checks;
}

function checkSectionSlideContrast(theme: any): ExtendedCheck {
  // Section slides use white text, check against the gradient midpoint
  // For simplicity, extract the dominant color from gradient
  const gradient = theme.gradients.sectionSlide;

  // Extract first color from gradient (rough approximation)
  const colorMatch = gradient.match(/hsl\(([^)]+)\)|#([A-Fa-f0-9]{6})/);
  let bgHsl: string;

  if (colorMatch) {
    if (colorMatch[1]) {
      bgHsl = colorMatch[1];
    } else if (colorMatch[2]) {
      bgHsl = hexToHsl('#' + colorMatch[2]);
    } else {
      bgHsl = "0 0% 40%"; // fallback
    }
  } else {
    bgHsl = "0 0% 40%"; // fallback
  }

  const white = "0 0% 100%";
  const ratio = getContrastRatio(white, bgHsl);
  const passes = meetsWCAG_AA(ratio, true);

  return {
    description: `Section slide (white text on gradient)`,
    foreground: white,
    background: bgHsl,
    ratio: Math.round(ratio * 10) / 10,
    passes,
    isLargeText: true,
    location: "Display & Play pages - Section slides"
  };
}

// Check all themes
const allThemes = [
  { ...DEFAULT_THEME, name: "Default" },
  ...Object.values(THEME_PRESETS)
];

let totalIssues = 0;

allThemes.forEach(theme => {
  console.log(`\n📊 ${theme.name} Theme`);
  console.log("─".repeat(70));

  // Standard checks
  const standardAnalysis = analyzeThemeContrast(theme);
  standardAnalysis.checks.forEach(check => {
    const status = check.passes ? "✓" : "✗";
    console.log(`${status} ${check.description}`);
    console.log(`   Ratio: ${check.ratio}:1 (${check.isLargeText ? "large" : "normal"} text)`);
    if (!check.passes) {
      console.log(`   ⚠️  FAILS WCAG AA`);
      totalIssues++;
    }
  });

  // Answer button checks
  const answerChecks = checkAnswerButtonContrast(theme);
  answerChecks.forEach(check => {
    const status = check.passes ? "✓" : "✗";
    console.log(`${status} ${check.description}`);
    console.log(`   Ratio: ${check.ratio}:1 (large text)`);
    console.log(`   Location: ${check.location}`);
    if (!check.passes) {
      console.log(`   ⚠️  FAILS WCAG AA`);
      totalIssues++;
    }
  });

  // Section slide check
  const sectionCheck = checkSectionSlideContrast(theme);
  const status = sectionCheck.passes ? "✓" : "✗";
  console.log(`${status} ${sectionCheck.description}`);
  console.log(`   Ratio: ${sectionCheck.ratio}:1 (large text)`);
  console.log(`   Location: ${sectionCheck.location}`);
  if (!sectionCheck.passes) {
    console.log(`   ⚠️  FAILS WCAG AA`);
    totalIssues++;
  }

  console.log(standardAnalysis.hasIssues || answerChecks.some(c => !c.passes) || !sectionCheck.passes
    ? "\n⚠️  Has accessibility issues"
    : "\n✅ All checks passed");
});

console.log("\n========================================");
console.log("AUDIT SUMMARY");
console.log("========================================");
console.log(`Total themes checked: ${allThemes.length}`);
console.log(`Total contrast violations: ${totalIssues}`);
if (totalIssues === 0) {
  console.log("✅ ALL THEMES PASS WCAG AA STANDARDS");
} else {
  console.log(`⚠️  ${totalIssues} CONTRAST ISSUES NEED FIXING`);
}
