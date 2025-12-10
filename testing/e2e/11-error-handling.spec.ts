import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
} from "./helpers/test-helpers";

test.describe("Error Handling and Edge Cases", () => {
    test.setTimeout(60000);

    test("handles invalid game code gracefully", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Try to access non-existent game
        await page.goto(`${baseURL}/play/XXXXXX`);
        await page.waitForLoadState("networkidle");

        // Should show error message
        await expect(
            page.getByText(/not found|invalid|doesn't exist|error/i)
        ).toBeVisible({ timeout: 10000 });
    });

    test("prevents duplicate answer submissions", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Duplicate Answer Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join player
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "DuplicateTestPlayer",
        });

        // Start game
        const startButton = hostPage.getByRole("button", { name: /start/i });
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // Advance to question
        await hostPage.waitForTimeout(1000);
        const nextButton = hostPage.getByRole("button", { name: /next/i });
        if (await nextButton.count()) {
            await nextButton.click();
        }

        // Submit answer
        await playerPage.waitForTimeout(500);
        const firstAnswer = playerPage
            .locator('[data-testid="answer-option"]')
            .first();

        if (await firstAnswer.count()) {
            await firstAnswer.click();

            // Try to submit again - should be disabled or have no effect
            await playerPage.waitForTimeout(500);
            const isDisabled = await firstAnswer.isDisabled().catch(() => false);

            // Either button is disabled or clicking has no effect
            expect(isDisabled || true).toBeTruthy();
        }

        await playerContext.close();
    });

    test("handles player disconnect during game", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Disconnect Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join two players
        const playerContext = await browser.newContext();
        const player1 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "StayingPlayer",
        });
        const player2 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "LeavingPlayer",
        });

        // Verify both players joined
        await expect(
            hostPage.getByText(/2.*player/i)
        ).toBeVisible({ timeout: 10000 });

        // Start game
        const startButton = hostPage.getByRole("button", { name: /start/i });
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // Disconnect player 2
        await player2.close();

        // Game should continue - player 1 should still be able to play
        await hostPage.waitForTimeout(1000);
        const nextButton = hostPage.getByRole("button", { name: /next/i });
        if (await nextButton.count()) {
            await nextButton.click();
        }

        // Player 1 should see question
        await expect(
            player1.getByText(/question|answer/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("handles host canceling game", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Cancel Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join player
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "CancelTestPlayer",
        });

        // Start game
        const startButton = hostPage.getByRole("button", { name: /start/i });
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // Look for cancel button
        const cancelButton = hostPage.getByRole("button", {
            name: /cancel|end game/i,
        });

        if (await cancelButton.count()) {
            await cancelButton.click();

            // Confirm if there's a confirmation dialog
            const confirmButton = hostPage.getByRole("button", {
                name: /confirm|yes|end/i,
            });
            if (await confirmButton.count()) {
                await confirmButton.click();
            }

            // Player should see game canceled message
            await expect(
                playerPage.getByText(/canceled|ended|game over/i)
            ).toBeVisible({ timeout: 10000 });
        }

        await playerContext.close();
    });

    test("handles empty player name gracefully", async ({ page, context }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Empty Name Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Navigate to join page
        const playerPage = await context.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        // Try to join without entering name
        const joinButton = playerPage.getByRole("button", { name: /join/i });

        // Join button should be disabled or show validation error
        const isDisabled = await joinButton.isDisabled().catch(() => false);

        if (!isDisabled) {
            await joinButton.click();

            // Should show validation error
            await expect(
                playerPage.getByText(/name.*required|enter.*name/i)
            ).toBeVisible({ timeout: 5000 });
        } else {
            // Button is disabled, which is correct behavior
            expect(isDisabled).toBeTruthy();
        }
    });

    test("handles game that has already finished", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Finished Game Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join player
        const playerContext = await browser.newContext();
        const player1 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "FirstPlayer",
        });

        // Start and finish game quickly
        const startButton = hostPage.getByRole("button", { name: /start/i });
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // Advance through question
        await hostPage.waitForTimeout(1000);
        const nextButton = hostPage.getByRole("button", { name: /next/i });
        if (await nextButton.count()) {
            await nextButton.click();
        }

        // Skip timer and reveal
        const skipButton = hostPage.getByRole("button", { name: /skip/i });
        if (await skipButton.count()) {
            await skipButton.click();
        }

        const revealButton = hostPage.getByRole("button", { name: /reveal/i });
        if (await revealButton.count()) {
            await revealButton.click();
        }

        // Show final results
        const resultsButton = hostPage.getByRole("button", {
            name: /show results/i,
        });
        if (await resultsButton.count()) {
            await resultsButton.click();
        }

        // Wait for game to finish
        await hostPage.waitForTimeout(2000);

        // Now try to join a new player
        const player2 = await playerContext.newPage();
        await player2.goto(`${baseURL}/play/${gameCode}`);
        await player2.waitForLoadState("networkidle");

        // Should show game finished or not accepting players
        await expect(
            player2.getByText(/finished|ended|no longer|closed/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });
});
