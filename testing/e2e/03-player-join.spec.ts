import { test, expect } from "@playwright/test";
import { createTestQuiz, createGameSession } from "./helpers/test-helpers";

test.describe("Player Join Flow", () => {
    test.setTimeout(60000);

    test("player can join game with emoji avatar", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Join Test Quiz",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Navigate to join page
        const playerPage = await context.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        // Verify join page loaded
        await expect(
            playerPage.getByText(/join|enter.*name|game code/i).first()
        ).toBeVisible({ timeout: 10000 });

        // Fill in name
        const nameInput = playerPage
            .locator('input[name="name"], input[placeholder*="name" i]')
            .first();
        await nameInput.fill("TestPlayer");

        // Select emoji avatar
        const emojiButton = playerPage.getByRole("button", { name: /😀/ });
        if (await emojiButton.count()) {
            await emojiButton.click();
        }

        // Join game
        await playerPage.getByRole("button", { name: /join/i }).click();

        // Verify joined successfully
        await expect(
            playerPage.getByText(/waiting|connected|lobby/i).first()
        ).toBeVisible({ timeout: 10000 });
    });

    test("player cannot join with invalid game code", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Try to join with invalid code
        await page.goto(`${baseURL}/play/INVALID`);
        await page.waitForLoadState("networkidle");

        // Should see error or redirect
        await expect(
            page.getByText(/not found|invalid|error|doesn't exist/i)
        ).toBeVisible({ timeout: 10000 });
    });

    test("player can join game in progress (late join)", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Late Join Test",
            questionCount: 2,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join first player
        const playerContext = await browser.newContext();
        const player1Page = await playerContext.newPage();
        await player1Page.goto(`${baseURL}/play/${gameCode}`);
        await player1Page.waitForLoadState("networkidle");

        const nameInput1 = player1Page
            .locator('input[name="name"]')
            .first();
        await nameInput1.fill("Player1");
        await player1Page.getByRole("button", { name: /join/i }).click();

        // Start game
        const startButton = hostPage.getByRole("button", { name: /start/i });
        await expect(startButton).toBeEnabled({ timeout: 15000 });
        await startButton.click();

        // Advance to first question
        await hostPage.waitForTimeout(1000);
        const nextButton = hostPage.getByRole("button", { name: /next/i });
        if (await nextButton.count()) {
            await nextButton.click();
        }

        // Now try to join a second player (late join)
        const player2Page = await playerContext.newPage();
        await player2Page.goto(`${baseURL}/play/${gameCode}`);
        await player2Page.waitForLoadState("networkidle");

        const nameInput2 = player2Page
            .locator('input[name="name"]')
            .first();
        await nameInput2.fill("LatePlayer");
        await player2Page.getByRole("button", { name: /join/i }).click();

        // Late player should join successfully or see appropriate message
        await expect(
            player2Page.getByText(/waiting|connected|in progress|question/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("multiple players can join with different avatars", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Avatar Test Quiz",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host to verify players
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join multiple players with different avatars
        const playerContext = await browser.newContext();
        const emojis = ["😀", "😎", "🤖"];

        for (let i = 0; i < 3; i++) {
            const playerPage = await playerContext.newPage();
            await playerPage.goto(`${baseURL}/play/${gameCode}`);
            await playerPage.waitForLoadState("networkidle");

            const nameInput = playerPage.locator('input[name="name"]').first();
            await nameInput.fill(`Player${i + 1}`);

            // Try to select specific emoji
            const emojiButton = playerPage.getByRole("button", {
                name: emojis[i],
            });
            if (await emojiButton.count()) {
                await emojiButton.click();
            }

            await playerPage.getByRole("button", { name: /join/i }).click();
            await playerPage.waitForTimeout(500);
        }

        // Verify host sees all 3 players
        await expect(
            hostPage.getByText(/3.*player/i)
        ).toBeVisible({ timeout: 15000 });

        await playerContext.close();
    });

    test("player sees game code on join page", async ({ page, context }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Game Code Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Navigate to join page
        const playerPage = await context.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        // Verify game code is displayed
        await expect(
            playerPage.getByText(gameCode, { exact: false })
        ).toBeVisible({ timeout: 10000 });
    });
});
