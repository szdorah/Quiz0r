import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
} from "./helpers/test-helpers";

/**
 * DEBUG TEST - Minimal test to inspect actual page state
 */

test.describe("Debug Test", () => {
    test.setTimeout(300000); // 5 minutes

    test("inspect player page state", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        console.log("\n=== DEBUG TEST ===\n");

        // Create quiz
        console.log("Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: "Debug Test",
            questionCount: 2,
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

        // Join ONE player
        console.log("\nJoining 1 player...");
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TestPlayer",
        });
        console.log("✓ Player joined");

        // Wait for player to appear on host
        await page.waitForTimeout(2000);

        // Start game
        console.log("\nStarting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log("✓ Game started");

        // Click Next Question to show first question
        console.log("\nAdvancing to first question...");
        const nextButton = page.getByRole("button", { name: /next question|next/i });
        await expect(nextButton).toBeVisible({ timeout: 15000 });
        await nextButton.click();
        await page.waitForTimeout(2000);
        console.log("✓ Advanced to question");

        // Wait for player to see question
        await playerPage.waitForTimeout(2000);

        // Log all buttons on the player page
        console.log("\n=== PLAYER PAGE BUTTONS ===");
        const allButtons = playerPage.locator("button");
        const buttonCount = await allButtons.count();
        console.log(`Found ${buttonCount} buttons on player page:`);

        for (let i = 0; i < buttonCount; i++) {
            const button = allButtons.nth(i);
            const text = await button.textContent();
            const isVisible = await button.isVisible();
            const isEnabled = await button.isEnabled();
            console.log(`  [${i}] "${text?.trim()}" (visible: ${isVisible}, enabled: ${isEnabled})`);
        }

        // Take a screenshot
        await playerPage.screenshot({ fullPage: true });
        console.log("\n✓ Screenshot saved to .playwright/results/");

        // Try to find answer buttons by different methods
        console.log("\n=== TRYING DIFFERENT SELECTORS ===");

        // Method 1: Buttons starting with A, B, C, D
        const method1 = playerPage.locator('button').filter({ hasText: /^[A-D]/ });
        const count1 = await method1.count();
        console.log(`Method 1 (hasText /^[A-D]/): ${count1} buttons`);

        // Method 2: Buttons containing just letters
        const method2 = playerPage.locator('button').filter({ hasText: /^[A-D]\s/ });
        const count2 = await method2.count();
        console.log(`Method 2 (hasText /^[A-D]\\s/): ${count2} buttons`);

        // Method 3: Look for specific text patterns
        for (const letter of ['A', 'B', 'C', 'D']) {
            const letterButtons = playerPage.locator('button').filter({ hasText: new RegExp(`^${letter}\\s`) });
            const letterCount = await letterButtons.count();
            if (letterCount > 0) {
                const text = await letterButtons.first().textContent();
                console.log(`  Found button starting with "${letter}": "${text?.trim()}"`);
            }
        }

        // Now try to click the first answer
        console.log("\n=== ATTEMPTING TO CLICK ANSWER ===");
        let clicked = false;

        for (let i = 0; i < buttonCount; i++) {
            const button = allButtons.nth(i);
            const text = await button.textContent();
            const trimmed = text?.trim() || "";

            // Check if this looks like an answer button (starts with A, B, C, or D followed by space)
            if (/^[A-D]\s/.test(trimmed)) {
                console.log(`Clicking button: "${trimmed}"`);
                await button.click();
                clicked = true;
                await playerPage.waitForTimeout(1000);

                // Take another screenshot after clicking
                await playerPage.screenshot({ fullPage: true });
                console.log("✓ Screenshot after click saved to .playwright/results/");
                break;
            }
        }

        if (!clicked) {
            console.log("❌ Could not find any answer button to click");
        } else {
            console.log("✅ Successfully clicked an answer button");
        }

        // Cleanup
        await playerContext.close();

        console.log("\n=== DEBUG TEST COMPLETE ===\n");
    });
});
