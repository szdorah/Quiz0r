import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTheme } from "@/lib/theme";

interface RouteParams {
  params: Promise<{ gameCode: string }>;
}

// GET /api/games/[gameCode] - Get game state
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameCode } = await params;

    const gameSession = await prisma.gameSession.findUnique({
      where: { gameCode: gameCode.toUpperCase() },
      include: {
        quiz: {
          select: {
            title: true,
            theme: true,
            questions: {
              select: {
                id: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        players: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            avatarColor: true,
            totalScore: true,
            isActive: true,
          },
          orderBy: { totalScore: "desc" },
        },
      },
    });

    if (!gameSession) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Determine available languages (base English + any question/answer translations)
    const questionLanguages = await prisma.questionTranslation.findMany({
      where: { question: { quizId: gameSession.quizId } },
      distinct: ["languageCode"],
      select: { languageCode: true },
    });

    const answerLanguages = await prisma.answerTranslation.findMany({
      where: { answer: { question: { quizId: gameSession.quizId } } },
      distinct: ["languageCode"],
      select: { languageCode: true },
    });

    const availableLanguages = Array.from(
      new Set<string>([
        "en",
        ...questionLanguages.map((q) => q.languageCode),
        ...answerLanguages.map((a) => a.languageCode),
      ])
    );

    // Parse theme JSON string to object
    const parsedTheme = parseTheme(gameSession.quiz.theme);

    return NextResponse.json({
      gameCode: gameSession.gameCode,
      status: gameSession.status,
      quizTitle: gameSession.quiz.title,
      quizTheme: parsedTheme,
      currentQuestionIndex: gameSession.currentQuestionIndex,
      totalQuestions: gameSession.quiz.questions.length,
      availableLanguages,
      players: gameSession.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        score: p.totalScore,
        isActive: p.isActive,
      })),
    });
  } catch (error) {
    console.error("Error fetching game:", error);
    return NextResponse.json(
      { error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}
