/**
 * Input Sanitization
 * Sanitizes text inputs to prevent XSS and data corruption
 */

import { ExportedQuiz } from "@/types/export";

export function sanitizeQuizData(quiz: ExportedQuiz): ExportedQuiz {
  return {
    ...quiz,
    title: sanitizeText(quiz.title),
    description: quiz.description ? sanitizeText(quiz.description) : null,
    questions: quiz.questions.map(q => ({
      ...q,
      questionText: sanitizeText(q.questionText),
      hostNotes: q.hostNotes ? sanitizeText(q.hostNotes) : null,
      answers: q.answers.map(a => ({
        ...a,
        answerText: sanitizeText(a.answerText),
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
