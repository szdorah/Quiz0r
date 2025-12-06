import { NextResponse } from "next/server";
import { translateQuestion } from "@/lib/openai-translate";
import { SupportedLanguages, type LanguageCode } from "@/types";

export const dynamic = "force-dynamic";

// POST /api/quizzes/[quizId]/questions/[questionId]/translate - Translate single question
export async function POST(
  request: Request,
  { params }: { params: { quizId: string; questionId: string } }
) {
  try {
    const { questionId } = params;
    const body = await request.json();
    const { targetLanguage } = body;

    // Validate target language
    if (!targetLanguage || !(targetLanguage in SupportedLanguages)) {
      return NextResponse.json(
        { error: "Invalid or missing target language" },
        { status: 400 }
      );
    }

    // Validate that target language is not English
    if (targetLanguage === "en") {
      return NextResponse.json(
        { error: "Cannot translate to English (base language)" },
        { status: 400 }
      );
    }

    // Perform translation
    const result = await translateQuestion(questionId, targetLanguage as LanguageCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Translation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question translated successfully",
    });
  } catch (error) {
    console.error("Failed to translate question:", error);
    return NextResponse.json(
      { error: "Failed to translate question" },
      { status: 500 }
    );
  }
}
