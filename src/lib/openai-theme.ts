import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { ThemeWizardAnswers, generateAIPrompt } from "@/lib/theme-template";
import { validateThemeJson } from "@/lib/theme";

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
 * Generate a theme JSON string from wizard answers using OpenAI
 */
export async function generateThemeFromAnswers(
  answers: ThemeWizardAnswers
): Promise<string> {
  const openai = await getOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = generateAIPrompt(answers);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "You create JSON themes for a quiz app. Always return ONLY raw JSON with no code fences or explanations.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error("No response from OpenAI");
  }

  let formattedJson: string;
  try {
    const parsed = JSON.parse(responseText);
    formattedJson = JSON.stringify(parsed, null, 2);
  } catch (error) {
    console.error("Failed to parse OpenAI theme response:", error);
    throw new Error("Failed to parse AI response");
  }

  const validationError = validateThemeJson(formattedJson);
  if (validationError) {
    throw new Error(validationError);
  }

  return formattedJson;
}
