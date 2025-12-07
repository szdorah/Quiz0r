import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { ordinalNumber } from "./certificate-utils";

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
 * Fallback messages when OpenAI is not configured or fails
 */
export function getFallbackMessage(
  playerName: string,
  position: number,
  totalPlayers: number
): string {
  const ordinal = ordinalNumber(position);
  const topPercentile = Math.ceil((position / totalPlayers) * 100);

  if (position === 1) {
    return `Congratulations on your 1st place finish, ${playerName}! You're the champion! 🏆`;
  }

  if (position === 2) {
    return `Amazing job securing 2nd place, ${playerName}! You're on the podium! 🥈`;
  }

  if (position === 3) {
    return `Excellent work earning 3rd place, ${playerName}! You made the podium! 🥉`;
  }

  if (topPercentile <= 25) {
    return `Great job finishing in ${ordinal} place, ${playerName}! You're in the top 25%! Keep up the awesome work! ⭐`;
  }

  return `Well done completing the quiz, ${playerName}! You finished in ${ordinal} place. Every quiz makes you smarter! 🎯`;
}

/**
 * Generate a personalized congratulatory message using OpenAI
 * Falls back to generic messages if OpenAI is not configured
 */
export async function generateCongratulatoryMessage(
  playerName: string,
  position: number,
  totalPlayers: number,
  score: number,
  quizTitle: string
): Promise<string> {
  try {
    // Get OpenAI client
    const openai = await getOpenAIClient();
    if (!openai) {
      console.log("OpenAI not configured, using fallback message");
      return getFallbackMessage(playerName, position, totalPlayers);
    }

    const ordinal = ordinalNumber(position);
    const systemPrompt = `You are a fun and encouraging quiz game announcer. Generate short, playful congratulatory messages for players who just completed a quiz. Keep it to 2-3 sentences maximum. Be enthusiastic but not over the top. Match the tone to their performance - more celebratory for winners, encouraging for everyone else.`;

    const userPrompt = `Player: ${playerName}
Position: ${ordinal} out of ${totalPlayers} players
Score: ${score} points
Quiz: "${quizTitle}"

Generate a personalized, fun, and playful congratulatory message. Make it feel warm and encouraging.`;

    // Call OpenAI API with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("OpenAI timeout")), 5000)
    );

    const completionPromise = openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.7, // More creative than translation
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const message = completion.choices[0]?.message?.content?.trim();

    if (!message) {
      console.warn("OpenAI returned empty response");
      return getFallbackMessage(playerName, position, totalPlayers);
    }

    return message;
  } catch (error) {
    console.warn("Failed to generate OpenAI message:", error);
    return getFallbackMessage(playerName, position, totalPlayers);
  }
}
