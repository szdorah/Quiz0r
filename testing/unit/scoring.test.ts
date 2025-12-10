/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import {
  calculateMultiSelectScore,
  calculateSingleSelectScore,
  isFullyCorrect,
} from "@/lib/scoring";

describe("scoring", () => {
  it("awards zero for incorrect single-select answers", () => {
    const score = calculateSingleSelectScore(100, 30000, 5000, false);
    expect(score).toBe(0);
  });

  it("awards higher single-select score for faster correct answers", () => {
    const slow = calculateSingleSelectScore(100, 30000, 25000, true);
    const fast = calculateSingleSelectScore(100, 30000, 5000, true);
    expect(fast).toBeGreaterThan(slow);
    expect(fast).toBeLessThanOrEqual(150); // capped at 50% speed bonus
  });

  it("applies partial credit and penalties for multi-select answers", () => {
    const points = calculateMultiSelectScore(
      100,
      30000,
      5000,
      ["a1", "a2", "wrong"],
      ["a1", "a2", "a3"]
    );
    // (2 correct - 1 wrong) / 3 = 0.33 base before speed bonus
    expect(points).toBeGreaterThan(30);
    expect(points).toBeLessThan(80);
  });

  it("returns zero for multi-select when accuracy is negative", () => {
    const points = calculateMultiSelectScore(
      100,
      30000,
      5000,
      ["wrong1", "wrong2"],
      ["a1", "a2", "a3"]
    );
    expect(points).toBe(0);
  });

  it("checks fully correct answers regardless of order", () => {
    expect(isFullyCorrect(["a1", "a2"], ["a2", "a1"])).toBe(true);
    expect(isFullyCorrect(["a1"], ["a1", "a2"])).toBe(false);
  });
});
