import { test } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    deleteQuiz,
} from "./helpers/test-helpers";

/**
 * DEBUG TEST: Verify translations are saved and available
 */

test.describe("Debug Translation System", () => {
    test.setTimeout(60000);

    test("verify translations are saved to database", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        console.log("\n====== DEBUG: Translation Storage Test ======\n");

        // Create quiz with translations
        console.log("1. Creating quiz with Spanish and French translations...");
        const { quizId } = await createTestQuiz(page, {
            title: "Debug Translation Test",
            questionCount: 2,
            languages: ['es', 'fr'],
        });
        console.log(`   ✓ Quiz ID: ${quizId}`);

        // Fetch quiz to verify translations were saved
        console.log("\n2. Fetching quiz data to verify translations...");
        const quizRes = await page.request.get(`${baseURL}/api/quizzes/${quizId}`);
        const quiz = await quizRes.json();

        console.log(`   Questions: ${quiz.questions.length}`);
        for (const question of quiz.questions) {
            console.log(`\n   Question: "${question.questionText}"`);
            console.log(`   Translations:`, question.translations ? Object.keys(question.translations) : 'none');

            if (question.translations) {
                for (const [lang, trans] of Object.entries(question.translations)) {
                    console.log(`      [${lang}]: "${(trans as any).questionText}"`);
                }
            }

            for (const answer of question.answers) {
                console.log(`   Answer: "${answer.answerText}"`);
                console.log(`   Answer Translations:`, answer.translations ? Object.keys(answer.translations) : 'none');

                if (answer.translations) {
                    for (const [lang, trans] of Object.entries(answer.translations)) {
                        console.log(`      [${lang}]: "${(trans as any).answerText}"`);
                    }
                }
            }
        }

        // Create game session
        console.log("\n3. Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Check game API response
        console.log("\n4. Fetching game data via /api/games/{gameCode}...");
        const gameRes = await page.request.get(`${baseURL}/api/games/${gameCode}`);
        const gameData = await gameRes.json();

        console.log(`   Available Languages:`, gameData.availableLanguages);
        console.log(`   Quiz ID from game:`, gameData.quizId);

        // Check if languages match
        if (gameData.availableLanguages && gameData.availableLanguages.length > 1) {
            console.log("\n   ✓ SUCCESS: Multiple languages detected!");
        } else {
            console.log("\n   ❌ FAIL: Only English detected, translations not recognized!");
        }

        // Cleanup
        console.log("\n5. Cleaning up...");
        await deleteQuiz(page, quizId);
        console.log("   ✓ Quiz deleted");

        console.log("\n====== DEBUG TEST COMPLETE ======\n");
    });
});
