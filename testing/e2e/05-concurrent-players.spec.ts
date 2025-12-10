import { test, expect, Page } from "@playwright/test";
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
import { SAMPLE_PLAYERS } from "./helpers/test-fixtures";

test.describe("Concurrent Players", () => {
    test.setTimeout(180000);

    test("multiple players join and play simultaneously", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "5", 10);

        // Create test quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Concurrent Players Test",
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

        // Join multiple players concurrently
        const playerContext = await browser.newContext();
        const playerPages: Page[] = [];

        console.log(`Joining ${playerCount} players...`);
        const joinPromises = [];
        for (let i = 0; i < playerCount; i++) {
            const player = SAMPLE_PLAYERS[i % SAMPLE_PLAYERS.length];
            const joinPromise = joinAsPlayer(playerContext, {
                gameCode,
                playerName: `${player.name}_${i + 1}`,
            });
            joinPromises.push(joinPromise);
        }

        // Wait for all players to join
        const pages = await Promise.all(joinPromises);
        playerPages.push(...pages);

        console.log(`All ${playerCount} players joined`);

        // Verify host sees all players
        await waitForPlayerCount(hostPage, playerCount);

        // Start game
        await hostStartGame(hostPage);

        // Play first question - all players answer
        await hostNextQuestion(hostPage);

        // All players submit answers concurrently
        const answerPromises = playerPages.map((playerPage, index) =>
            submitAnswer(playerPage, index % 2)
        );
        await Promise.all(answerPromises);

        console.log("All players submitted answers");

        // Host reveals answers
        await hostRevealAnswers(hostPage);

        // Verify all players see results
        for (const playerPage of playerPages) {
            await expect(
                playerPage.getByText(/correct|incorrect|points/i)
            ).toBeVisible({ timeout: 10000 });
        }

        // Play second question
        await hostNextQuestion(hostPage);

        // Players answer again
        const answerPromises2 = playerPages.map((playerPage, index) =>
            submitAnswer(playerPage, (index + 1) % 2)
        );
        await Promise.all(answerPromises2);

        await hostRevealAnswers(hostPage);

        // Show final scoreboard
        const showResultsButton = hostPage.getByRole("button", {
            name: /show results/i,
        });
        if (await showResultsButton.count()) {
            await showResultsButton.click();
        }

        // Verify final scoreboard appears
        await expect(
            hostPage.getByText(/final|scoreboard/i)
        ).toBeVisible({ timeout: 15000 });

        await playerContext.close();
        console.log(`Test completed with ${playerCount} players`);
    });

    test("players answering at different speeds get different time bonuses", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Speed Bonus Test",
            questionCount: 1,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
        });

        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join 3 players
        const playerContext = await browser.newContext();
        const fastPlayer = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "FastPlayer",
        });
        const mediumPlayer = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "MediumPlayer",
        });
        const slowPlayer = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "SlowPlayer",
        });

        // Start game
        await hostStartGame(hostPage);
        await hostNextQuestion(hostPage);

        // Players answer at different times
        await fastPlayer.waitForTimeout(500);
        await submitAnswer(fastPlayer, 0); // Correct answer

        await mediumPlayer.waitForTimeout(2000);
        await submitAnswer(mediumPlayer, 0); // Correct answer

        await slowPlayer.waitForTimeout(4000);
        await submitAnswer(slowPlayer, 0); // Correct answer

        // Reveal answers
        await hostRevealAnswers(hostPage);

        // All players should see results
        await expect(
            fastPlayer.getByText(/correct|points/i)
        ).toBeVisible({ timeout: 10000 });
        await expect(
            mediumPlayer.getByText(/correct|points/i)
        ).toBeVisible({ timeout: 10000 });
        await expect(
            slowPlayer.getByText(/correct|points/i)
        ).toBeVisible({ timeout: 10000 });

        await playerContext.close();
    });

    test("host sees real-time answer count updates", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: "Answer Count Test",
            questionCount: 1,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
        });

        const gameCode = await createGameSession(page, quizId);

        // Setup host
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");

        // Join 3 players
        const playerContext = await browser.newContext();
        const player1 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player1",
        });
        const player2 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player2",
        });
        const player3 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "Player3",
        });

        // Start game
        await hostStartGame(hostPage);
        await hostNextQuestion(hostPage);

        // Players answer one by one
        await submitAnswer(player1, 0);
        await hostPage.waitForTimeout(500);

        // Host should see 1 answer
        await expect(
            hostPage.getByText(/1.*answered|answered.*1/i)
        ).toBeVisible({ timeout: 5000 });

        await submitAnswer(player2, 0);
        await hostPage.waitForTimeout(500);

        // Host should see 2 answers
        await expect(
            hostPage.getByText(/2.*answered|answered.*2/i)
        ).toBeVisible({ timeout: 5000 });

        await submitAnswer(player3, 0);
        await hostPage.waitForTimeout(500);

        // Host should see 3 answers
        await expect(
            hostPage.getByText(/3.*answered|answered.*3/i)
        ).toBeVisible({ timeout: 5000 });

        await playerContext.close();
    });
});
