/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { validateQuizStructure } from "@/lib/validate-import";

const baseQuiz = {
  exportVersion: "1.0",
  exportedAt: new Date().toISOString(),
  title: "Sample Quiz",
  description: "desc",
  questions: [
    {
      questionText: "Q1",
      questionType: "SINGLE_SELECT",
      timeLimit: 30,
      points: 100,
      orderIndex: 0,
      answers: [
        { id: "a1", answerText: "A1", isCorrect: true, orderIndex: 0 },
        { id: "a2", answerText: "A2", isCorrect: false, orderIndex: 1 },
      ],
    },
  ],
};

describe("validateQuizStructure", () => {
  it("accepts a minimal valid quiz", () => {
    const result = validateQuizStructure(baseQuiz);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported versions", () => {
    const result = validateQuizStructure({ ...baseQuiz, exportVersion: "9.9" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported export version");
  });

  it("rejects invalid question type", () => {
    const bad = {
      ...baseQuiz,
      questions: [{ ...baseQuiz.questions[0], questionType: "BAD" }],
    };
    const result = validateQuizStructure(bad);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("invalid question type");
  });
});
