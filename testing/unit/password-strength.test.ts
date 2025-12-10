/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { calculatePasswordStrength } from "@/lib/password-strength";

describe("calculatePasswordStrength", () => {
  it("rejects passwords shorter than 12 characters", () => {
    const result = calculatePasswordStrength("short");
    expect(result.isValid).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rewards variety and length", () => {
    const result = calculatePasswordStrength("LongerPass123!");
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.feedback.length).toBeGreaterThan(0);
  });
});
