/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import {
  analyzeThemeContrast,
  getContrastRatio,
  getContrastStatus,
  meetsWCAG_AA,
} from "@/lib/contrast-checker";

describe("contrast checker", () => {
  it("calculates higher ratios for distinct colors", () => {
    const high = getContrastRatio("0 0% 0%", "0 0% 100%"); // black on white
    const low = getContrastRatio("0 0% 50%", "0 0% 60%");
    expect(high).toBeGreaterThan(low);
    expect(meetsWCAG_AA(high)).toBe(true);
  });

  it("returns readable status string", () => {
    const ratio = getContrastRatio("0 0% 0%", "0 0% 100%");
    expect(getContrastStatus(ratio)).toContain("Pass");
  });

  it("flags themes with low contrast", () => {
    const analysis = analyzeThemeContrast({
      name: "Test",
      colors: {
        primary: "0 0% 55%",
        primaryForeground: "0 0% 50%",
        background: "0 0% 52%",
        foreground: "0 0% 60%",
        card: "0 0% 52%",
        cardForeground: "0 0% 55%",
      },
    });
    expect(analysis.hasIssues).toBe(true);
    expect(analysis.checks.some((c) => !c.passes)).toBe(true);
  });
});
