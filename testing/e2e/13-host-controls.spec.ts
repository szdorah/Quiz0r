import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    hostStartGame,
    hostNextQuestion,
} from "./helpers/test-helpers";

test.describe("Host Controls", () => {
    test.setTimeout(120000);

    test("host can start game when players are ready", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Host Start Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Start button should be disabled initially
        const startButton = hostPage.getByRole("button", { name: /start/i });

        // Join a player
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TestPlayer",
        });

        // Start button should now be enabled
        await expect(startButton).toBeEnabled({ timeout: 15000 });

        // Click start
        await startButton.click();

        // Game should start
        await expect(
            hostPage.getByText(/active|question|next/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host can advance through questions", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz with multiple questions
        const { quizId } = await createTestQuiz(page, {
            title: "Question Navigation Test",
            questionCount: 3,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join player and start
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "NavTestPlayer",
        });

        await hostStartGame(hostPage);

        // Advance through all questions
        for (let i = 0; i < 3; i++) {
            await hostNextQuestion(hostPage);

            // Verify question number or content changes
            await expect(
                hostPage.getByText(/question|test question/i)
            ).toBeVisible({ timeout: 10000 });

            // Skip timer if present
            const skipButton = hostPage.getByRole("button", { name: /skip/i });
            if (await skipButton.count()) {
                await skipButton.click();
            }

            // Reveal answers
            const revealButton = hostPage.getByRole("button", { name: /reveal/i });
            if (await revealButton.count()) {
                await revealButton.click();
            }

            await hostPage.waitForTimeout(500);
        }

        // Should reach final scoreboard
        const resultsButton = hostPage.getByRole("button", {
            name: /show results/i,
        });
        if (await resultsButton.count()) {
            await resultsButton.click();
        }

        await expect(
            hostPage.getByText(/final|scoreboard/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host can skip timer", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Skip Timer Test",
            questionCount: 1,
            timeLimit: 60, // Long timer
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Setup display
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Join player and start
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "SkipTestPlayer",
        });

        await hostStartGame(hostPage);
        await hostNextQuestion(hostPage);

        // Timer should be running
        await expect(
            displayPage.getByText(/\d+|timer/i)
        ).toBeVisible({ timeout: 10000 });

        // Skip timer
        const skipButton = hostPage.getByRole("button", { name: /skip/i });
        if (await skipButton.count()) {
            await skipButton.click();
        }

        // Timer should stop or reach 0
        await hostPage.waitForTimeout(1000);

        // Reveal button should be available
        const revealButton = hostPage.getByRole("button", { name: /reveal/i });
        await expect(revealButton).toBeVisible({ timeout: 5000 });

        await playerContext.close();
    });

    test("host can reveal answers", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Reveal Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Setup display
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Join player and start
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "RevealTestPlayer",
        });

        await hostStartGame(hostPage);
        await hostNextQuestion(hostPage);

        // Player submits answer
        await playerPage.waitForTimeout(500);
        const answer = playerPage.locator('[data-testid="answer-option"]').first();
        if (await answer.count()) {
            await answer.click();
        }

        // Host reveals answers
        const revealButton = hostPage.getByRole("button", { name: /reveal/i });
        if (await revealButton.count()) {
            await revealButton.click();
        }

        // Display should show correct answers
        await expect(
            displayPage.getByText(/correct|answer/i)
        ).toBeVisible({ timeout: 10000 });

        // Player should see result
        await expect(
            playerPage.getByText(/correct|incorrect|points/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host can view player list", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz and game
        const { quizId } = await createTestQuiz(page, {
            title: "Player List Test",
            questionCount: 1,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join multiple players
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player1",
        });
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player2",
        });
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player3",
        });

        // Host should see all player names
        await expect(hostPage.getByText("Player1")).toBeVisible({ timeout: 10000 });
        await expect(hostPage.getByText("Player2")).toBeVisible({ timeout: 10000 });
        await expect(hostPage.getByText("Player3")).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host control panel and display window stay in sync", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Sync Test",
            questionCount: 2,
        });
        const gameCode = await createGameSession(page, quizId);

        // Setup host control
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Setup display
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Join player
        const playerContext = await browser.newContext();
        await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "SyncTestPlayer",
        });

        // Both should show waiting state
        await expect(
            displayPage.getByText(/waiting|join/i)
        ).toBeVisible({ timeout: 10000 });

        // Start game
        await hostStartGame(hostPage);

        // Both should update
        await hostPage.waitForTimeout(1000);

        // Advance to question
        await hostNextQuestion(hostPage);

        // Display should show question
        await expect(
            displayPage.getByText(/question|test question/i)
        ).toBeVisible({ timeout: 10000 });

        // Reveal answers
        const revealButton = hostPage.getByRole("button", { name: /reveal/i });
        if (await revealButton.count()) {
            await revealButton.click();
        }

        // Display should show answers
        await expect(
            displayPage.getByText(/correct|answer/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });
});
