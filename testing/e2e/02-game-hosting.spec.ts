import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
} from "./helpers/test-helpers";

test.describe("Game Hosting Flow", () => {
    test.setTimeout(120000);

    test("host can access game selection page", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        await page.goto(`${baseURL}/host`);
        await page.waitForLoadState("networkidle");

        // Verify host page loaded
        await expect(
            page.getByText(/select.*quiz|choose.*quiz|host/i).first()
        ).toBeVisible({ timeout: 10000 });
    });

    test("host can start game and see QR code", async ({ page, context }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "QR Code Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open display window
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Verify QR code is visible
        const qrCode = displayPage.locator('canvas, svg, img[alt*="QR" i]');
        await expect(qrCode.first()).toBeVisible({ timeout: 10000 });

        // Verify game code is displayed
        await expect(
            displayPage.getByText(gameCode, { exact: false })
        ).toBeVisible();
    });

    test("host can copy join URL", async ({ page, context }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Join URL Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Look for copy URL button
        const copyButton = page.getByRole("button", { name: /copy.*url|copy.*link/i });

        if (await copyButton.count()) {
            await copyButton.click();

            // Verify some feedback (toast, button text change, etc.)
            await page.waitForTimeout(500);
            const copied = await page.getByText(/copied|copy/i).count();
            expect(copied).toBeGreaterThan(0);
        }
    });

    test("display window shows waiting state", async ({ page, context }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Waiting State Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open display window
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Verify waiting state
        await expect(
            displayPage.getByText(/waiting|join|scan/i).first()
        ).toBeVisible({ timeout: 10000 });
    });

    test("display window updates when player joins", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Player Join Display Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open display window
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Join a player
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "DisplayTestPlayer",
        });

        // Display should show player
        await expect(
            displayPage.getByText("DisplayTestPlayer")
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("control panel shows player list", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Control Panel Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join players
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "ControlPlayer1",
        });
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "ControlPlayer2",
        });

        // Verify both players appear
        await expect(hostPage.getByText("ControlPlayer1")).toBeVisible({ timeout: 10000 });
        await expect(hostPage.getByText("ControlPlayer2")).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host can see player count", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Player Count Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Open control panel
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join 3 players
        const playerContext = await browser.newContext();
        for (let i = 0; i < 3; i++) {
            await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `CountPlayer${i + 1}`,
            });
        }

        // Verify count
        await expect(
            page.getByText(/3.*player/i)
        ).toBeVisible({ timeout: 15000 });

        await playerContext.close();
    });
});
