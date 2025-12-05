import { QuizTheme, DEFAULT_THEME } from "@/types/theme";

/**
 * Deep merge two objects, with source overriding target
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Validates and parses a theme JSON string.
 * Returns the merged theme with defaults, or null if invalid.
 */
export function parseTheme(themeJson: string | null | undefined): QuizTheme | null {
  if (!themeJson) return null;

  try {
    const parsed = JSON.parse(themeJson);
    return validateAndMergeTheme(parsed);
  } catch {
    console.error("Failed to parse theme JSON");
    return null;
  }
}

/**
 * Validates a theme object and merges it with defaults.
 * This ensures all required fields are present.
 */
export function validateAndMergeTheme(
  theme: Partial<QuizTheme>
): QuizTheme {
  // Merge with defaults to fill in any missing fields
  return deepMerge(DEFAULT_THEME as unknown as Record<string, unknown>, theme as Record<string, unknown>) as unknown as QuizTheme;
}

/**
 * Validates if a string is valid JSON that can be parsed as a theme.
 * Returns an error message if invalid, or null if valid.
 */
export function validateThemeJson(json: string): string | null {
  if (!json.trim()) {
    return "Theme JSON is empty";
  }

  try {
    const parsed = JSON.parse(json);

    // Check for required top-level fields
    if (typeof parsed !== "object" || parsed === null) {
      return "Theme must be a JSON object";
    }

    if (!parsed.name || typeof parsed.name !== "string") {
      return "Theme must have a 'name' field";
    }

    // Validate colors if present
    if (parsed.colors) {
      const requiredColors = [
        "primary",
        "primaryForeground",
        "background",
        "foreground",
      ];
      for (const color of requiredColors) {
        if (parsed.colors[color] && typeof parsed.colors[color] !== "string") {
          return `colors.${color} must be a string`;
        }
      }
    }

    // Validate answerColors if present
    if (parsed.answerColors) {
      const requiredAnswerColors = ["a", "b", "c", "d"];
      for (const color of requiredAnswerColors) {
        if (
          parsed.answerColors[color] &&
          typeof parsed.answerColors[color] !== "string"
        ) {
          return `answerColors.${color} must be a string`;
        }
      }
    }

    return null; // Valid
  } catch (e) {
    if (e instanceof SyntaxError) {
      return `Invalid JSON: ${e.message}`;
    }
    return "Failed to parse theme JSON";
  }
}

/**
 * Converts a theme to a JSON string for storage.
 */
export function stringifyTheme(theme: QuizTheme): string {
  return JSON.stringify(theme, null, 2);
}
