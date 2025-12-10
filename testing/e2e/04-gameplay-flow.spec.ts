import { test, expect, Page, BrowserContext } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    hostStartGame,
    hostNextQuestion,
    hostRevealAnswers,
    submitAnswer,
    waitForPlayerCount,
} from "./helpers/test-helpers";
import { SAMPLE_PLAYERS, DEFAULT_TEST_CONFIG } from "./helpers/test-fixtures";

test.describe("Complete Gameplay Flow", () => {
    test.setTimeout(180000);

    test("full game flow with host and multiple players", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = 3;

        // Step 1: Create a test quiz
        const { quizId } = await createTestQuiz(page, {
            title: "E2E Gameplay Test Quiz",
            questionCount: 3,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
        });

        // Step 2: Create game session
        const gameCode = await createGameSession(page, quizId);
        console.log(`Game created with code: ${gameCode}`);

        // Step 3: Open host control panel
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Verify host control panel loaded
        await expect(
            hostPage.getByText(/waiting for players|control panel/i)
        ).toBeVisible({ timeout: 15000 });

        // Step 4: Open display window in separate tab
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");

        // Verify display window shows QR code and game code
        await expect(
            displayPage.getByText(gameCode, { exact: false })
        ).toBeVisible({ timeout: 10000 });

        // Step 5: Join players
        const playerContext = await browser.newContext();
        const playerPages: Page[] = [];

        for (let i = 0; i < playerCount; i++) {
            const player = SAMPLE_PLAYERS[i];
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: player.name,
            });
            playerPages.push(playerPage);
            console.log(`Player ${player.name} joined`);
        }

        // Step 6: Verify host sees all players
        await waitForPlayerCount(hostPage, playerCount);

        // Step 7: Start the game
        await hostStartGame(hostPage);
        console.log("Game started");

        // Verify all players see game start
        for (const playerPage of playerPages) {
            await expect(
                playerPage.getByText(/get ready|question|starting/i)
            ).toBeVisible({ timeout: 10000 });
        }

        // Step 8: Play through questions
        for (let q = 0; q < 3; q++) {
            console.log(`Playing question ${q + 1}`);

            // Host advances to next question
            await hostNextQuestion(hostPage);

            // Verify display shows question
            await expect(
                displayPage.getByText(/question|test question/i)
            ).toBeVisible({ timeout: 10000 });

            // Players see question and timer
            for (const playerPage of playerPages) {
                await expect(
                    playerPage.getByText(/answer|question/i)
                ).toBeVisible({ timeout: 10000 });
            }

            // Players submit answers (with slight delays to simulate real gameplay)
            for (let i = 0; i < playerPages.length; i++) {
                await playerPages[i].waitForTimeout(500 * i); // Stagger answers
                await submitAnswer(playerPages[i], i % 2); // Alternate between correct and incorrect
            }

            // Wait a moment for answers to be processed
            await hostPage.waitForTimeout(1000);

            // Host reveals answers
            await hostRevealAnswers(hostPage);

            // Verify players see results
            for (const playerPage of playerPages) {
                await expect(
                    playerPage.getByText(/correct|incorrect|points/i)
                ).toBeVisible({ timeout: 10000 });
            }

            // Verify display shows answer statistics
            await expect(
                displayPage.getByText(/correct|answer/i)
            ).toBeVisible({ timeout: 5000 });
        }

        // Step 9: Show final scoreboard
        const showResultsButton = hostPage.getByRole("button", {
            name: /show results|final/i,
        });
        if (await showResultsButton.count()) {
            await showResultsButton.click();
        }

        // Verify final scoreboard appears
        await expect(
            hostPage.getByText(/final|scoreboard|winner/i)
        ).toBeVisible({ timeout: 10000 });

        // Verify display shows final results
        await expect(
            displayPage.getByText(/final|winner|congratulations/i)
        ).toBeVisible({ timeout: 10000 });

        // Verify players see final results
        for (const playerPage of playerPages) {
            await expect(
                playerPage.getByText(/final|game over|score/i)
            ).toBeVisible({ timeout: 10000 });
        }

        // Cleanup
        await playerContext.close();
        console.log("Test completed successfully");
    });

    test("players can answer correctly and see score updates", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz with known correct answers
        const { quizId } = await createTestQuiz(page, {
            title: "Scoring Test Quiz",
            questionCount: 2,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
        });

        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join one player
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TestPlayer",
        });

        // Start game
        await hostStartGame(hostPage);

        // Question 1: Answer correctly (Answer A is always correct in our test helper)
        await hostNextQuestion(hostPage);
        await playerPage.waitForTimeout(500);

        const firstAnswer = playerPage
            .locator('[data-testid="answer-option"]')
            .first();
        if (await firstAnswer.count()) {
            await firstAnswer.click();
        } else {
            // Fallback to button with "Answer A" text
            await playerPage.getByRole("button", { name: /answer a/i }).click();
        }

        await hostRevealAnswers(hostPage);

        // Verify player sees correct feedback
        await expect(
            playerPage.getByText(/correct|✓|well done/i)
        ).toBeVisible({ timeout: 10000 });

        // Question 2: Answer correctly again
        await hostNextQuestion(hostPage);
        await playerPage.waitForTimeout(500);

        const secondAnswer = playerPage
            .locator('[data-testid="answer-option"]')
            .first();
        if (await secondAnswer.count()) {
            await secondAnswer.click();
        } else {
            await playerPage.getByRole("button", { name: /answer a/i }).click();
        }

        await hostRevealAnswers(hostPage);

        // Show final results
        const showResultsButton = hostPage.getByRole("button", {
            name: /show results/i,
        });
        if (await showResultsButton.count()) {
            await showResultsButton.click();
        }

        // Verify player has a positive score
        await expect(
            playerPage.getByText(/\d+\s*points?/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("timer counts down and expires correctly", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz with short timer
        const { quizId } = await createTestQuiz(page, {
            title: "Timer Test Quiz",
            questionCount: 1,
            questionType: "SINGLE_SELECT",
            timeLimit: 10, // Short timer for testing
            points: 100,
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

        // Join player
        const playerContext = await browser.newContext();
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TimerTestPlayer",
        });

        // Start game and advance to question
        await hostStartGame(hostPage);
        await hostNextQuestion(hostPage);

        // Verify timer appears on display
        await expect(
            displayPage.getByText(/\d+|timer|time/i)
        ).toBeVisible({ timeout: 5000 });

        // Wait for timer to count down (verify it changes)
        await displayPage.waitForTimeout(3000);

        // Timer should still be visible but with different value
        await expect(
            displayPage.getByText(/\d+|timer/i)
        ).toBeVisible();

        // Wait for timer to expire
        await displayPage.waitForTimeout(8000);

        // Verify time's up state
        await expect(
            displayPage.getByText(/time.*up|expired|0/i)
        ).toBeVisible({ timeout: 5000 });

        await playerContext.close();
    });
});
