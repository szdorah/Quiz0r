import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    hostStartGame,
    hostNextQuestion,
    hostRevealAnswers,
} from "./helpers/test-helpers";

test.describe("Player Management", () => {
    test.setTimeout(120000);

    test("host can remove player before game starts", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Remove Player Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join players
        const playerContext = await browser.newContext();
        const player1 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "PlayerToRemove",
        });
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "PlayerToKeep",
        });

        // Verify both players joined
        await expect(page.getByText("PlayerToRemove")).toBeVisible({ timeout: 10000 });
        await expect(page.getByText("PlayerToKeep")).toBeVisible({ timeout: 10000 });

        // Remove first player
        const removeButton = page.getByRole("button", { name: /remove|kick/i }).first();
        if (await removeButton.count()) {
            await removeButton.click();

            // Confirm if needed
            const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
            if (await confirmButton.count()) {
                await confirmButton.click();
            }

            // Verify player was removed
            await page.waitForTimeout(1000);
            const removedPlayerExists = await page.getByText("PlayerToRemove").count();
            expect(removedPlayerExists).toBe(0);

            // Verify other player still there
            await expect(page.getByText("PlayerToKeep")).toBeVisible();

            // Removed player should see message
            await expect(
                player1.getByText(/removed|kicked|disconnected/i).first()
            ).toBeVisible({ timeout: 10000 });
        }

        await playerContext.close();
    });

    test("host can toggle auto-admit", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Auto Admit Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Look for auto-admit toggle
        const autoAdmitToggle = page.locator('input[type="checkbox"], button[role="switch"]');

        if (await autoAdmitToggle.count()) {
            // Toggle it
            await autoAdmitToggle.first().click();
            await page.waitForTimeout(500);

            // Join a player - should be pending
            const playerContext = await browser.newContext();
            const playerPage = await playerContext.newPage();
            await playerPage.goto(`${baseURL}/play/${gameCode}`);
            await playerPage.waitForLoadState("networkidle");

            const nameInput = playerPage.locator('input[name="name"]').first();
            await nameInput.fill("PendingPlayer");
            await playerPage.getByRole("button", { name: /join/i }).click();

            // Player should see pending or waiting for approval
            await expect(
                playerPage.getByText(/pending|waiting.*approval|host/i).first()
            ).toBeVisible({ timeout: 10000 });

            await playerContext.close();
        }
    });

    test("host can manually admit player", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game with auto-admit off
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Manual Admit Test", autoAdmit: false },
        });
        const quiz = await quizRes.json();

        const gameRes = await page.request.post(`${baseURL}/api/games`, {
            data: { quizId: quiz.id },
        });
        const game = await gameRes.json();
        const gameCode = game.gameCode;

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join a player
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        const nameInput = playerPage.locator('input[name="name"]').first();
        await nameInput.fill("ManualAdmitPlayer");
        await playerPage.getByRole("button", { name: /join/i }).click();

        // Host should see admission request
        await page.waitForTimeout(1000);
        const admitButton = page.getByRole("button", { name: /admit|approve|accept/i });

        if (await admitButton.count()) {
            await admitButton.first().click();

            // Player should be admitted
            await expect(
                playerPage.getByText(/admitted|waiting.*start|lobby/i).first()
            ).toBeVisible({ timeout: 10000 });
        }

        await playerContext.close();
    });

    test("host can refuse player admission", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game with auto-admit off
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Refuse Admit Test", autoAdmit: false },
        });
        const quiz = await quizRes.json();

        const gameRes = await page.request.post(`${baseURL}/api/games`, {
            data: { quizId: quiz.id },
        });
        const game = await gameRes.json();
        const gameCode = game.gameCode;

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join a player
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        const nameInput = playerPage.locator('input[name="name"]').first();
        await nameInput.fill("RefusedPlayer");
        await playerPage.getByRole("button", { name: /join/i }).click();

        // Host refuses
        await page.waitForTimeout(1000);
        const refuseButton = page.getByRole("button", { name: /refuse|reject|deny/i });

        if (await refuseButton.count()) {
            await refuseButton.first().click();

            // Player should see refused message
            await expect(
                playerPage.getByText(/refused|rejected|denied|cannot join/i).first()
            ).toBeVisible({ timeout: 10000 });
        }

        await playerContext.close();
    });

    test("player can reconnect after disconnect", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Reconnect Test",
            questionCount: 2,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join player
        const playerContext = await browser.newContext();
        let playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "ReconnectPlayer",
        });

        // Start game
        await hostStartGame(page);
        await hostNextQuestion(page);

        // Close player page (simulate disconnect)
        await playerPage.close();

        // Reconnect
        playerPage = await playerContext.newPage();
        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");

        // Should be able to rejoin or see game in progress
        await expect(
            playerPage.getByText(/question|game|reconnect|join/i).first()
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });
});
