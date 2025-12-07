/**
 * Input Sanitization
 * Sanitizes text inputs to prevent XSS and data corruption
 */

import { ExportedQuiz } from "@/types/export";

export function sanitizeQuizData(quiz: ExportedQuiz): ExportedQuiz {
  const powerUps = quiz.powerUps ?? {
    hintCount: (quiz as any).hintCount,
    copyAnswerCount: (quiz as any).copyAnswerCount,
    doublePointsCount: (quiz as any).doublePointsCount,
  };

  return {
    ...quiz,
    exportVersion: quiz.exportVersion ?? "1.0",
    title: sanitizeText(quiz.title),
    description: quiz.description ? sanitizeText(quiz.description) : null,
    autoAdmit: quiz.autoAdmit ?? true,
    powerUps: {
      hintCount: sanitizeCount(powerUps.hintCount),
      copyAnswerCount: sanitizeCount(powerUps.copyAnswerCount),
      doublePointsCount: sanitizeCount(powerUps.doublePointsCount),
    },
    questions: quiz.questions.map(q => ({
      ...q,
      questionText: sanitizeText(q.questionText),
      hostNotes: q.hostNotes ? sanitizeText(q.hostNotes) : null,
      hint: q.hint ? sanitizeText(q.hint) : null,
      easterEggEnabled: q.easterEggEnabled ?? false,
      easterEggButtonText: q.easterEggButtonText ? sanitizeText(q.easterEggButtonText) : null,
      easterEggUrl: q.easterEggUrl ? sanitizeText(q.easterEggUrl) : null,
      easterEggDisablesScoring: q.easterEggDisablesScoring ?? false,
      translations: q.translations?.map(t => ({
        ...t,
        languageCode: typeof t.languageCode === "string" ? t.languageCode.trim() : "",
        questionText: sanitizeText(t.questionText),
        hostNotes: t.hostNotes ? sanitizeText(t.hostNotes) : null,
        hint: t.hint ? sanitizeText(t.hint) : null,
        easterEggButtonText: t.easterEggButtonText ? sanitizeText(t.easterEggButtonText) : null,
      })) ?? [],
      answers: q.answers.map(a => ({
        ...a,
        answerText: sanitizeText(a.answerText),
        translations: a.translations?.map(t => ({
          ...t,
          languageCode: typeof t.languageCode === "string" ? t.languageCode.trim() : "",
          answerText: sanitizeText(t.answerText),
        })) ?? [],
      })),
    })),
  };
}

function sanitizeText(text: string): string {
  return text
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize whitespace (collapse multiple spaces)
    .replace(/\s+/g, " ")
    // Trim to reasonable length
    .substring(0, 2000);
}

function sanitizeCount(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(10, Math.max(0, Math.round(value)));
}
