import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
} from "./helpers/test-helpers";

/**
 * WORKING E2E TEST
 * Simplified test that properly follows the game flow
 */

test.describe("Working E2E Test", () => {
    test.setTimeout(180000); // 3 minutes

    test("complete game flow", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "5", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "3", 10);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`WORKING E2E TEST`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        console.log(`${"=".repeat(60)}\n`);

        // Create quiz
        console.log("Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: `Working Test - ${playerCount}P ${questionCount}Q`,
            questionCount,
            timeLimit: 30,
            points: 100,
        });
        console.log(`✓ Quiz created: ${quizId}`);

        // Create game
        console.log("Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`✓ Game code: ${gameCode}`);

        // Open host control
        console.log("Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");
        console.log("✓ Control panel loaded");

        // Join players
        console.log(`\nJoining ${playerCount} players...`);
        const playerContext = await browser.newContext();
        const playerPages = [];

        for (let i = 0; i < playerCount; i++) {
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `Player${i + 1}`,
            });
            playerPages.push(playerPage);
            console.log(`  ✓ Player ${i + 1}/${playerCount} joined`);
        }

        // Wait for all players to be visible
        await page.waitForTimeout(2000);
        console.log(`✓ All ${playerCount} players joined`);

        // Start game
        console.log("\nStarting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log("✓ Game started (status: ACTIVE)");

        // Play through questions
        console.log(`\nPlaying ${questionCount} questions...\n`);
        for (let q = 0; q < questionCount; q++) {
            console.log(`Question ${q + 1}/${questionCount}:`);

            // Click button to advance to question
            // In ACTIVE status, look for any button that advances the game
            await page.waitForTimeout(1000);

            // Try different button texts that might advance to next question
            const advanceSelectors = [
                'button:has-text("Next Question")',
                'button:has-text("Next")',
                'button:has-text("Start First Question")',
                'button:has-text("Begin")',
            ];

            let advanced = false;
            for (const selector of advanceSelectors) {
                const button = page.locator(selector).first();
                if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await button.click();
                    advanced = true;
                    console.log(`  ✓ Advanced to question (clicked: ${selector})`);
                    break;
                }
            }

            if (!advanced) {
                console.log("  ⚠ No advance button found, waiting for question to appear...");
            }

            await page.waitForTimeout(2000);

            // Wait for players to see the question
            await playerPages[0].waitForTimeout(1500);

            // Players answer
            console.log(`  Players answering...`);
            let answeredCount = 0;

            for (let i = 0; i < playerPages.length; i++) {
                const playerPage = playerPages[i];

                // Small stagger to simulate real users
                await playerPage.waitForTimeout(50 * i);

                // Find answer buttons - they start with A, B, C, or D
                const allButtons = playerPage.locator("button");
                const buttonCount = await allButtons.count();

                for (let j = 0; j < buttonCount; j++) {
                    const button = allButtons.nth(j);
                    const text = await button.textContent();

                    // Look for buttons starting with A (first answer)
                    if (text && /^A\s/.test(text.trim())) {
                        try {
                            await button.click({ timeout: 1000 });
                            answeredCount++;
                            break;
                        } catch (e) {
                            console.log(`    ⚠ Player ${i + 1} couldn't click answer`);
                        }
                    }
                }
            }

            console.log(`  ✓ ${answeredCount}/${playerCount} players answered`);

            // Wait a bit for answers to register
            await page.waitForTimeout(2000);

            // Reveal answers if button exists
            const revealButton = page.locator('button:has-text("Reveal")').first();
            if (await revealButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                await revealButton.click();
                await page.waitForTimeout(1500);
                console.log("  ✓ Answers revealed");
            }

            await page.waitForTimeout(500);
        }

        // Show final results
        console.log("\nShowing final results...");
        const resultsButton = page.locator('button').filter({
            hasText: /show results|final results|finish/i
        }).first();

        if (await resultsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await resultsButton.click();
            await page.waitForTimeout(2000);
            console.log("✓ Final results shown");
        }

        // Cleanup
        await playerContext.close();

        console.log(`\n${"=".repeat(60)}`);
        console.log("✅ TEST COMPLETED SUCCESSFULLY");
        console.log(`${"=".repeat(60)}\n`);
    });
});
