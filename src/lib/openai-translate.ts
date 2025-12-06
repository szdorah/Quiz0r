import { prisma } from "@/lib/db";
import { SupportedLanguages, type LanguageCode } from "@/types";
import OpenAI from "openai";

interface TranslationRequest {
  questionText: string;
  hint?: string | null;
  hostNotes?: string | null;
  easterEggButtonText?: string | null;
  answers: Array<{
    id: string;
    answerText: string;
  }>;
}

interface TranslationResponse {
  questionText: string;
  hint?: string | null;
  hostNotes?: string | null;
  easterEggButtonText?: string | null;
  answers: Array<{
    id: string;
    answerText: string;
  }>;
}

/**
 * Get OpenAI client instance with API key from database
 */
async function getOpenAIClient(): Promise<OpenAI | null> {
  const apiKeySetting = await prisma.setting.findUnique({
    where: { key: "openai_api_key" },
  });

  if (!apiKeySetting?.value) {
    return null;
  }

  return new OpenAI({
    apiKey: apiKeySetting.value,
  });
}

/**
 * Translate a single question to a target language using OpenAI GPT-4o
 * @param questionId - The question ID to translate
 * @param targetLanguage - The target language code (e.g., 'es', 'fr')
 * @returns Success status
 */
export async function translateQuestion(
  questionId: string,
  targetLanguage: LanguageCode
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get OpenAI client
    const openai = await getOpenAIClient();
    if (!openai) {
      return { success: false, error: "OpenAI API key not configured" };
    }

    // Get question with answers
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Prepare translation request
    const request: TranslationRequest = {
      questionText: question.questionText,
      hint: question.hint,
      hostNotes: question.hostNotes,
      easterEggButtonText: question.easterEggButtonText,
      answers: question.answers.map((a) => ({
        id: a.id,
        answerText: a.answerText,
      })),
    };

    const languageInfo = SupportedLanguages[targetLanguage];
    const systemPrompt = `You are a professional translator for educational quiz content.
Translate from English to ${languageInfo.name} (${languageInfo.nativeName}).

CRITICAL RULES:
1. Maintain EXACT JSON structure
2. Only translate text values, never IDs or field names
3. Preserve formatting and line breaks
4. Keep technical terms accurate
5. Ensure cultural appropriateness
6. Return ONLY valid JSON with no markdown formatting or code blocks
7. If a field is null or empty, keep it null/empty in the response`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Translate this quiz question to ${languageInfo.name}:\n\n${JSON.stringify(request, null, 2)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return { success: false, error: "No response from OpenAI" };
    }

    // Parse response
    const translated = JSON.parse(responseText) as TranslationResponse;

    // Save question translation
    await prisma.questionTranslation.upsert({
      where: {
        questionId_languageCode: {
          questionId: questionId,
          languageCode: targetLanguage,
        },
      },
      update: {
        questionText: translated.questionText,
        hint: translated.hint,
        hostNotes: translated.hostNotes,
        easterEggButtonText: translated.easterEggButtonText,
        isAutoTranslated: true,
        updatedAt: new Date(),
      },
      create: {
        questionId: questionId,
        languageCode: targetLanguage,
        questionText: translated.questionText,
        hint: translated.hint,
        hostNotes: translated.hostNotes,
        easterEggButtonText: translated.easterEggButtonText,
        isAutoTranslated: true,
      },
    });

    // Save answer translations
    for (const translatedAnswer of translated.answers) {
      const originalAnswer = question.answers.find((a) => a.id === translatedAnswer.id);
      if (originalAnswer) {
        await prisma.answerTranslation.upsert({
          where: {
            answerId_languageCode: {
              answerId: originalAnswer.id,
              languageCode: targetLanguage,
            },
          },
          update: {
            answerText: translatedAnswer.answerText,
            isAutoTranslated: true,
            updatedAt: new Date(),
          },
          create: {
            answerId: originalAnswer.id,
            languageCode: targetLanguage,
            answerText: translatedAnswer.answerText,
            isAutoTranslated: true,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to translate question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}

/**
 * Translate an entire quiz to a target language
 * @param quizId - The quiz ID to translate
 * @param targetLanguage - The target language code
 * @param onProgress - Optional progress callback (current, total)
 * @returns Success status with translation count
 */
export async function translateEntireQuiz(
  quizId: string,
  targetLanguage: LanguageCode,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; translated: number; failed: number; errors: string[] }> {
  try {
    // Get all questions for the quiz (excluding SECTION type)
    const questions = await prisma.question.findMany({
      where: {
        quizId: quizId,
        questionType: { not: "SECTION" },
      },
      orderBy: { orderIndex: "asc" },
    });

    if (questions.length === 0) {
      return { success: true, translated: 0, failed: 0, errors: [] };
    }

    let translated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      // Report progress
      if (onProgress) {
        onProgress(i + 1, questions.length);
      }

      // Translate the question
      const result = await translateQuestion(question.id, targetLanguage);

      if (result.success) {
        translated++;
      } else {
        failed++;
        errors.push(`Question ${i + 1}: ${result.error || "Unknown error"}`);
      }

      // Add delay between requests to avoid rate limits (500ms)
      if (i < questions.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return {
      success: failed === 0,
      translated,
      failed,
      errors,
    };
  } catch (error) {
    console.error("Failed to translate quiz:", error);
    return {
      success: false,
      translated: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : "Translation failed"],
    };
  }
}

/**
 * Get translation status for a quiz
 * @param quizId - The quiz ID
 * @returns Translation status for each supported language
 */
export async function getQuizTranslationStatus(quizId: string): Promise<
  Array<{
    languageCode: LanguageCode;
    languageName: string;
    isComplete: boolean;
    totalFields: number;
    translatedFields: number;
    lastUpdated: string | null;
  }>
> {
  try {
    // Get all questions with their answers (excluding SECTION type)
    const questions = await prisma.question.findMany({
      where: {
        quizId: quizId,
        questionType: { not: "SECTION" },
      },
      include: {
        answers: true,
        translations: true,
      },
    });

    if (questions.length === 0) {
      return [];
    }

    // Calculate total translatable fields per language
    let totalFieldsPerLanguage = 0;
    for (const question of questions) {
      // Question text (always counted)
      totalFieldsPerLanguage += 1;

      // Optional fields (only count if they exist in English)
      if (question.hint) totalFieldsPerLanguage += 1;
      if (question.hostNotes) totalFieldsPerLanguage += 1;
      if (question.easterEggButtonText) totalFieldsPerLanguage += 1;

      // Answer texts
      totalFieldsPerLanguage += question.answers.length;
    }

    // Build status for each supported language (excluding English)
    const statuses = await Promise.all(
      (Object.keys(SupportedLanguages) as LanguageCode[])
        .filter((code) => code !== "en")
        .map(async (languageCode) => {
          const languageInfo = SupportedLanguages[languageCode];

          // Get all translations for this language
          const questionTranslations = await prisma.questionTranslation.findMany({
            where: {
              questionId: { in: questions.map((q) => q.id) },
              languageCode: languageCode,
            },
          });

          const answerTranslations = await prisma.answerTranslation.findMany({
            where: {
              answerId: {
                in: questions.flatMap((q) => q.answers.map((a) => a.id)),
              },
              languageCode: languageCode,
            },
          });

          // Count translated fields
          let translatedFields = 0;

          for (const question of questions) {
            const qTranslation = questionTranslations.find((t) => t.questionId === question.id);

            if (qTranslation) {
              // Question text
              if (qTranslation.questionText) translatedFields += 1;

              // Optional fields (only count if they exist in English)
              if (question.hint && qTranslation.hint) translatedFields += 1;
              if (question.hostNotes && qTranslation.hostNotes) translatedFields += 1;
              if (question.easterEggButtonText && qTranslation.easterEggButtonText)
                translatedFields += 1;
            }

            // Answer texts
            for (const answer of question.answers) {
              const aTranslation = answerTranslations.find((t) => t.answerId === answer.id);
              if (aTranslation && aTranslation.answerText) {
                translatedFields += 1;
              }
            }
          }

          // Find most recent update
          const allTranslations = [
            ...questionTranslations.map((t) => t.updatedAt),
            ...answerTranslations.map((t) => t.updatedAt),
          ];
          const lastUpdated = allTranslations.length > 0
            ? new Date(Math.max(...allTranslations.map((d) => d.getTime()))).toISOString()
            : null;

          return {
            languageCode,
            languageName: `${languageInfo.flag} ${languageInfo.name}`,
            isComplete: translatedFields === totalFieldsPerLanguage,
            totalFields: totalFieldsPerLanguage,
            translatedFields,
            lastUpdated,
          };
        })
    );

    return statuses;
  } catch (error) {
    console.error("Failed to get translation status:", error);
    return [];
  }
}
