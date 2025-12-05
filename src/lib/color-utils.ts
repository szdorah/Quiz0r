/**
 * Color utility functions for theme system
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val /= 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if a color is light or dark based on its luminance
 * Returns true if the color is light (needs dark text)
 */
export function isLightColor(hexColor: string): boolean {
  const [r, g, b] = hexToRgb(hexColor);
  const luminance = getLuminance(r, g, b);

  // Threshold of 0.18 ensures WCAG AA compliance (3:1 for large text)
  // Any color with luminance > 0.18 needs dark text for accessibility
  // This conservative threshold ensures buttons always pass contrast requirements
  return luminance > 0.18;
}

/**
 * Get appropriate text color (black or white) for a given background color
 * Returns HSL string format to match theme system
 */
export function getContrastingTextColor(backgroundHex: string): string {
  const isLight = isLightColor(backgroundHex);

  // Return dark text for light backgrounds, light text for dark backgrounds
  return isLight ? "0 0% 10%" : "0 0% 100%";
}
