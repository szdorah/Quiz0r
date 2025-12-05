import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

// GET /api/quizzes/[quizId]/questions - List questions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;

    const questions = await prisma.question.findMany({
      where: { quizId },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes/[quizId]/questions - Create question with answers
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const {
      questionText,
      imageUrl,
      hostNotes,
      questionType = "SINGLE_SELECT",
      timeLimit = 30,
      points = 100,
      answers = [],
    } = body;

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return NextResponse.json(
        { error: "At least 2 answers are required" },
        { status: 400 }
      );
    }

    // Get the next order index
    const lastQuestion = await prisma.question.findFirst({
      where: { quizId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrderIndex = (lastQuestion?.orderIndex ?? -1) + 1;

    // Create question with answers in a transaction
    const question = await prisma.question.create({
      data: {
        quizId,
        questionText: questionText.trim(),
        imageUrl: imageUrl?.trim() || null,
        hostNotes: hostNotes?.trim() || null,
        questionType,
        timeLimit,
        points,
        orderIndex: nextOrderIndex,
        answers: {
          create: answers.map(
            (
              answer: {
                answerText: string;
                imageUrl?: string;
                isCorrect?: boolean;
              },
              index: number
            ) => ({
              answerText: answer.answerText.trim(),
              imageUrl: answer.imageUrl?.trim() || null,
              isCorrect: answer.isCorrect ?? false,
              orderIndex: index,
            })
          ),
        },
      },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
