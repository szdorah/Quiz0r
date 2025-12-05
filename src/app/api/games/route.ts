import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { customAlphabet } from "nanoid";

// Generate 6-character game codes (avoiding ambiguous characters)
const generateGameCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6
);

// POST /api/games - Create a new game session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId } = body;

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    // Verify quiz exists and has questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId, isActive: true },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    if (quiz._count.questions === 0) {
      return NextResponse.json(
        { error: "Quiz has no questions" },
        { status: 400 }
      );
    }

    // Generate unique game code
    let gameCode: string;
    let attempts = 0;
    do {
      gameCode = generateGameCode();
      const existing = await prisma.gameSession.findUnique({
        where: { gameCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique game code" },
        { status: 500 }
      );
    }

    // Create game session
    const gameSession = await prisma.gameSession.create({
      data: {
        gameCode,
        quizId,
        status: "WAITING",
      },
      include: {
        quiz: {
          select: {
            title: true,
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    return NextResponse.json(gameSession, { status: 201 });
  } catch (error) {
    console.error("Error creating game session:", error);
    return NextResponse.json(
      { error: "Failed to create game session" },
      { status: 500 }
    );
  }
}
