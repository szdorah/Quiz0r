/// <reference types="vitest" />
import { describe, it, expect } from "vitest";
import { sanitizeQuizData } from "@/lib/sanitize";
import { ExportedQuiz } from "@/types/export";

const baseQuiz: ExportedQuiz = {
  exportVersion: "1.0",
  title: "  <script>alert('x')</script>  ",
  description: "  Hello\u0000World  ",
  autoAdmit: false,
  powerUps: {
    hintCount: 2,
    copyAnswerCount: 1,
    doublePointsCount: 0,
  },
  questions: [
    {
      id: "q1",
      questionText: "  Question\u0008 One  ",
      questionType: "SINGLE_SELECT",
      timeLimit: 30,
      points: 100,
      hostNotes: " Note ",
      answers: [
        { id: "a1", answerText: "  Answer 1  ", isCorrect: true },
        { id: "a2", answerText: "  Answer 2  ", isCorrect: false },
      ],
      translations: [
        {
          languageCode: " fr ",
          questionText: "Bonjour ",
          hostNotes: null,
          hint: null,
          easterEggButtonText: null,
        },
      ],
    },
  ],
};

describe("sanitizeQuizData", () => {
  it("trims and strips control characters across quiz content", () => {
    const sanitized = sanitizeQuizData(baseQuiz);
    expect(sanitized.title).toBe("<script>alert('x')</script>");
    expect(sanitized.description).toBe("HelloWorld");
    expect(sanitized.questions[0].questionText).toBe("Question One");
    expect(sanitized.questions[0].answers[0].answerText).toBe("Answer 1");
    expect(sanitized.questions[0].translations?.[0].languageCode).toBe("fr");
  });

  it("normalizes missing powerUps and clamps counts", () => {
    const dirty = {
      ...baseQuiz,
      powerUps: undefined,
      questions: baseQuiz.questions,
    } as unknown as ExportedQuiz;
    const sanitized = sanitizeQuizData(dirty);
    expect(sanitized.powerUps.hintCount).toBeGreaterThanOrEqual(0);
    expect(sanitized.powerUps.copyAnswerCount).toBeLessThanOrEqual(10);
  });
});
