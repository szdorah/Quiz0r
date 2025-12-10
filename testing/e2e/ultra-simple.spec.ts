import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    submitRandomAnswer,
} from "./helpers/test-helpers";

/**
 * ULTRA SIMPLE TEST - Just 1 player, 1 question
 * This will help us debug exactly what's happening
 */

test.describe("Ultra Simple Test", () => {
    test.setTimeout(180000); // 3 minutes

    test("one player answers one question", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        console.log(`\n${"=".repeat(70)}`);
        console.log(`ULTRA SIMPLE TEST - 1 PLAYER, 1 QUESTION`);
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz with just 1 question
        console.log("📝 Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: "Ultra Simple Test",
            questionCount: 1,
            timeLimit: 60, // Long timer so we have time
            points: 100,
        });
        console.log(`   ✓ Quiz ID: ${quizId}`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        console.log("\n🖥️  Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");
        console.log("   ✓ Control panel loaded");

        // Join ONE player
        console.log("\n👤 Joining 1 player...");
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TestPlayer",
        });
        console.log("   ✓ Player joined");

        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        console.log("   ✓ Start button clicked");

        // Wait longer for game to start
        await page.waitForTimeout(5000);
        console.log("   ✓ Waited 5 seconds for game to start");

        // Check what status the game is in
        const bodyText = await page.textContent('body');
        console.log(`\n📊 Checking game status...`);
        if (bodyText?.includes('QUESTION')) {
            console.log("   ✓ Game status is QUESTION");
        } else if (bodyText?.includes('ACTIVE')) {
            console.log("   ⚠️  Game status is ACTIVE");
        } else {
            console.log("   ⚠️  Game status unknown");
        }

        // Check if there's a "Next Question" button on host
        console.log("\n🔍 Looking for Next Question button...");
        const nextButton = page.locator('button').filter({ hasText: /next question|next|begin|start first/i });
        const nextButtonCount = await nextButton.count();
        console.log(`   Found ${nextButtonCount} potential next buttons`);

        if (nextButtonCount > 0) {
            for (let i = 0; i < nextButtonCount; i++) {
                const text = await nextButton.nth(i).textContent();
                const isVisible = await nextButton.nth(i).isVisible();
                console.log(`   Button ${i}: "${text?.trim()}" (visible: ${isVisible})`);

                if (isVisible) {
                    console.log(`   ✓ Clicking button: "${text?.trim()}"`);
                    await nextButton.nth(i).click();
                    await page.waitForTimeout(3000);
                    break;
                }
            }
        }

        // Now check player page
        console.log("\n👀 Checking player page...");

        // Wait a bit more
        await playerPage.waitForTimeout(3000);

        // Log all visible text on player page
        const playerBodyText = await playerPage.textContent('body');
        console.log("   Player page contains:", playerBodyText?.substring(0, 200));

        // Look for answer buttons
        console.log("\n🔍 Looking for answer buttons on player page...");
        const allButtons = playerPage.locator("button");
        const buttonCount = await allButtons.count();
        console.log(`   Found ${buttonCount} total buttons`);

        // Try to submit a random answer
        try {
            console.log("\n👆 Attempting to submit random answer...");
            const answer = await submitRandomAnswer(playerPage);
            console.log(`   ✓ Answer selected: ${answer.letter}`);
        } catch (error) {
            console.log("   ❌ Failed to submit answer:", error);

            // Fallback: show button details for debugging
            for (let i = 0; i < Math.min(buttonCount, 10); i++) {
                const button = allButtons.nth(i);
                const text = await button.textContent();
                const isVisible = await button.isVisible();
                const isEnabled = await button.isEnabled();
                console.log(`   Button ${i}: "${text?.trim()}" (visible: ${isVisible}, enabled: ${isEnabled})`);
            }
        }

        // Check on host if answer was registered
        await page.waitForTimeout(2000);
        console.log("\n📊 Checking if answer was registered on host...");
        const hostBodyText = await page.textContent('body');
        if (hostBodyText?.includes('1 / 1') || hostBodyText?.includes('1/1')) {
            console.log("   ✅ Answer registered! (1/1 players answered)");
        } else if (hostBodyText?.includes('0 / 1') || hostBodyText?.includes('0/1')) {
            console.log("   ❌ Answer NOT registered (0/1 players answered)");
        } else {
            console.log("   ⚠️  Could not determine answer status");
        }

        // Take screenshots for debugging
        const timestamp = new Date().toISOString().replace(/:/g, "-");
        await playerPage.screenshot({ fullPage: true });
        await page.screenshot({ fullPage: true });
        console.log("\n📸 Screenshots saved to .playwright/results/");

        // Cleanup
        await playerContext.close();

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ TEST COMPLETED");
        console.log(`${"=".repeat(70)}\n`);
    });
});
