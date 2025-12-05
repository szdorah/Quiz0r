import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/quizzes - List all quizzes
export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
