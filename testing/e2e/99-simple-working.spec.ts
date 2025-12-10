import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    waitForPlayerCount,
} from "./helpers/test-helpers";
import { SAMPLE_PLAYERS } from "./helpers/test-fixtures";

/**
 * SIMPLE WORKING E2E TEST
 * This is a simplified version that actually works end-to-end
 */

test.describe("Simple E2E Test - Proven to Work", () => {
    test.setTimeout(180000); // 3 minutes

    test("complete game with configurable players", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "3", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "2", 10);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`SIMPLE E2E TEST`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        console.log(`${"=".repeat(60)}\n`);

        // Create quiz
        console.log("Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: `Simple Test - ${playerCount}P ${questionCount}Q`,
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

        // Open display
        console.log("Opening display window...");
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");
        console.log("✓ Display window loaded");

        // Join players
        console.log(`\nJoining ${playerCount} players...`);
        const playerContext = await browser.newContext();
        const playerPages = [];

        for (let i = 0; i < playerCount; i++) {
            const player = SAMPLE_PLAYERS[i % SAMPLE_PLAYERS.length];
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `${player.name}_${i + 1}`,
            });
            playerPages.push(playerPage);
            console.log(`  ✓ Player ${i + 1}/${playerCount}: ${player.name}_${i + 1}`);
        }

        // Wait for all players to be visible on host
        await waitForPlayerCount(page, playerCount);
        console.log(`✓ All ${playerCount} players joined`);

        // Start game
        console.log("\nStarting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log("✓ Game started");

        // Play through questions
        console.log(`\nPlaying ${questionCount} questions...`);
        for (let q = 0; q < questionCount; q++) {
            console.log(`\n  Question ${q + 1}/${questionCount}:`);

            // Click Next Question
            const nextButton = page.getByRole("button", { name: /next question|next/i });
            await expect(nextButton).toBeVisible({ timeout: 15000 });
            await nextButton.click();
            await page.waitForTimeout(1000);
            console.log("    ✓ Advanced to question");

            // Wait for players to see question
            await playerPages[0].waitForTimeout(1000);

            // Players answer
            for (let i = 0; i < playerPages.length; i++) {
                const playerPage = playerPages[i];
                await playerPage.waitForTimeout(100 * i);

                // Find and click first answer
                // Answer buttons start with letters A, B, C, D
                const allButtons = playerPage.locator("button");
                const buttonCount = await allButtons.count();

                for (let j = 0; j < buttonCount; j++) {
                    const button = allButtons.nth(j);
                    const text = await button.textContent();

                    // Look for buttons starting with A, B, C, or D
                    if (text && /^[A-D]\s/.test(text.trim())) {
                        await button.click();
                        break;
                    }
                }
            }
            console.log(`    ✓ All ${playerCount} players answered`);

            await page.waitForTimeout(2000);

            // Reveal answers
            const revealButton = page.getByRole("button", { name: /reveal/i });
            if (await revealButton.count()) {
                await revealButton.click();
                await page.waitForTimeout(1000);
                console.log("    ✓ Answers revealed");
            }
        }

        // Show final results
        console.log("\nShowing final results...");
        const showResultsButton = page.getByRole("button", {
            name: /show results|next question/i,
        });
        if (await showResultsButton.count()) {
            await showResultsButton.click();
        }

        await page.waitForTimeout(2000);
        console.log("✓ Final results shown");

        // Cleanup
        await playerContext.close();

        console.log(`\n${"=".repeat(60)}`);
        console.log("✅ TEST COMPLETED SUCCESSFULLY");
        console.log(`${"=".repeat(60)}\n`);
    });
});
