/**
 * Export/Import Type Definitions
 * Defines the structure of exported quiz data
 */

export interface ExportedQuiz {
  exportVersion: "1.0";
  exportedAt: string; // ISO timestamp
  title: string;
  description: string | null;
  theme: string | null; // JSON string of QuizTheme
  questions: ExportedQuestion[];
}

export interface ExportedQuestion {
  questionText: string;
  imageRef: string | null; // Path in ZIP: e.g., "images/q_0.jpg"
  hostNotes: string | null;
  questionType: "SINGLE_SELECT" | "MULTI_SELECT" | "SECTION";
  timeLimit: number;
  points: number;
  orderIndex: number;
  answers: ExportedAnswer[];
}

export interface ExportedAnswer {
  answerText: string;
  imageRef: string | null; // Path in ZIP: e.g., "images/a_0_2.jpg"
  isCorrect: boolean;
  orderIndex: number;
}
