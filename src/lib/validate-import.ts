/**
 * Quiz Import Validation
 * Validates imported quiz structure and constraints
 */

import { ExportedQuiz } from "@/types/export";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateQuizStructure(data: unknown): ValidationResult {
  // Type guard
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Quiz data must be an object" };
  }

  const quiz = data as Partial<ExportedQuiz>;

  // Required fields
  if (!quiz.title || typeof quiz.title !== "string" || quiz.title.trim() === "") {
    return { valid: false, error: "Quiz title is required" };
  }

  if (quiz.title.length > 200) {
    return { valid: false, error: "Quiz title is too long (max 200 characters)" };
  }

  if (quiz.description !== null && quiz.description !== undefined) {
    if (typeof quiz.description !== "string") {
      return { valid: false, error: "Quiz description must be a string" };
    }
    if (quiz.description.length > 1000) {
      return { valid: false, error: "Quiz description is too long (max 1000 characters)" };
    }
  }

  // Theme validation
  if (quiz.theme !== null && quiz.theme !== undefined) {
    if (typeof quiz.theme !== "string") {
      return { valid: false, error: "Quiz theme must be a JSON string or null" };
    }

    // Try to parse theme JSON
    if (quiz.theme) {
      try {
        JSON.parse(quiz.theme);
      } catch {
        return { valid: false, error: "Quiz theme is not valid JSON" };
      }
    }
  }

  // Questions validation
  if (!Array.isArray(quiz.questions)) {
    return { valid: false, error: "Questions must be an array" };
  }

  if (quiz.questions.length === 0) {
    return { valid: false, error: "Quiz must have at least one question" };
  }

  if (quiz.questions.length > 200) {
    return { valid: false, error: "Too many questions (max 200)" };
  }

  // Validate each question
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const result = validateQuestion(q, i);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

function validateQuestion(q: unknown, index: number): ValidationResult {
  if (!q || typeof q !== "object") {
    return { valid: false, error: `Question ${index + 1} is invalid` };
  }

  const question = q as any;

  // Required fields
  if (!question.questionText || typeof question.questionText !== "string") {
    return { valid: false, error: `Question ${index + 1}: questionText is required` };
  }

  if (question.questionText.length > 500) {
    return { valid: false, error: `Question ${index + 1}: text is too long (max 500 characters)` };
  }

  // Question type
  const validTypes = ["SINGLE_SELECT", "MULTI_SELECT", "SECTION"];
  if (!validTypes.includes(question.questionType)) {
    return { valid: false, error: `Question ${index + 1}: invalid question type (must be SINGLE_SELECT, MULTI_SELECT, or SECTION)` };
  }

  // Time limit
  if (typeof question.timeLimit !== "number" || question.timeLimit < 0 || question.timeLimit > 300) {
    return { valid: false, error: `Question ${index + 1}: invalid time limit (must be 0-300 seconds)` };
  }

  // Points
  if (typeof question.points !== "number" || question.points < 0 || question.points > 10000) {
    return { valid: false, error: `Question ${index + 1}: invalid points value (must be 0-10000)` };
  }

  // Order index
  if (typeof question.orderIndex !== "number" || question.orderIndex < 0) {
    return { valid: false, error: `Question ${index + 1}: invalid order index` };
  }

  // Answers
  if (!Array.isArray(question.answers)) {
    return { valid: false, error: `Question ${index + 1}: answers must be an array` };
  }

  // Sections don't need answers, but regular questions do
  if (question.questionType !== "SECTION") {
    if (question.answers.length < 2) {
      return { valid: false, error: `Question ${index + 1}: must have at least 2 answers` };
    }

    if (question.answers.length > 6) {
      return { valid: false, error: `Question ${index + 1}: too many answers (max 6)` };
    }

    // Check at least one correct answer
    const hasCorrect = question.answers.some((a: any) => a.isCorrect === true);
    if (!hasCorrect) {
      return { valid: false, error: `Question ${index + 1}: must have at least one correct answer` };
    }

    // Validate each answer
    for (let j = 0; j < question.answers.length; j++) {
      const a = question.answers[j];

      if (!a || typeof a !== "object") {
        return { valid: false, error: `Question ${index + 1}, Answer ${j + 1}: invalid` };
      }

      if (!a.answerText || typeof a.answerText !== "string") {
        return { valid: false, error: `Question ${index + 1}, Answer ${j + 1}: text is required` };
      }

      if (a.answerText.length > 200) {
        return { valid: false, error: `Question ${index + 1}, Answer ${j + 1}: text is too long (max 200 characters)` };
      }

      if (typeof a.isCorrect !== "boolean") {
        return { valid: false, error: `Question ${index + 1}, Answer ${j + 1}: isCorrect must be boolean` };
      }

      if (typeof a.orderIndex !== "number" || a.orderIndex < 0) {
        return { valid: false, error: `Question ${index + 1}, Answer ${j + 1}: invalid order index` };
      }
    }
  } else {
    // Sections should have zero answers
    if (question.answers.length > 0) {
      return { valid: false, error: `Question ${index + 1}: SECTION questions should not have answers` };
    }
  }

  return { valid: true };
}
