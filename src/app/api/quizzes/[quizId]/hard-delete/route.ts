import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

/**
 * POST /api/quizzes/[quizId]/hard-delete - Permanently delete quiz
 *
 * WARNING: This endpoint is intended for testing only.
 * It performs a hard delete (permanent removal) of the quiz and all related data.
 *
 * Cascade deletes:
 * - Questions (via onDelete: Cascade)
 * - Answers (via Question cascade)
 * - QuestionTranslations (via Question cascade)
 * - AnswerTranslations (via Answer cascade)
 * - GameSessions (explicitly handled)
 * - Players (via GameSession cascade)
 * - PlayerAnswers (via Player cascade)
 * - PowerUpUsages (via Player cascade)
 * - EasterEggClicks (via Player cascade)
 * - Certificates (via GameSession cascade)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;

    // First, delete all game sessions associated with this quiz
    // This will cascade delete players, answers, certificates, etc.
    await prisma.gameSession.deleteMany({
      where: { quizId },
    });

    // Now delete the quiz itself
    // This will cascade delete questions, answers, and translations
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({
      success: true,
      message: "Quiz and all related data permanently deleted"
    });
  } catch (error) {
    console.error("Error hard deleting quiz:", error);

    // Check if quiz doesn't exist
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
