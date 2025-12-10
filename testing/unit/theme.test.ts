/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { parseTheme, validateAndMergeTheme, validateThemeJson, stringifyTheme } from "@/lib/theme";
import { DEFAULT_THEME } from "@/types/theme";

describe("theme utilities", () => {
  it("parses valid theme JSON and merges defaults", () => {
    const json = JSON.stringify({ name: "Custom", colors: { primary: "10 20% 30%" } });
    const result = parseTheme(json);
    expect(result?.name).toBe("Custom");
    expect(result?.colors.primary).toBe("10 20% 30%");
    expect(result?.colors.background).toBe(DEFAULT_THEME.colors.background);
  });

  it("returns null on invalid JSON", () => {
    const result = parseTheme("{bad}");
    expect(result).toBeNull();
  });

  it("validates theme JSON structure", () => {
    expect(validateThemeJson("")).toBeTruthy();
    expect(validateThemeJson('{"name": "Ok"}')).toBeNull();
    expect(validateThemeJson('{"name": 2}')).toContain("name");
  });

  it("stringifies theme with pretty JSON", () => {
    const str = stringifyTheme(DEFAULT_THEME);
    expect(str).toContain('"name"');
    expect(str).toContain("\n");
  });
});
