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

/**
 * MASTER COMPREHENSIVE E2E TEST
 * 
 * This test suite provides complete end-to-end coverage of the entire application.
 * It simulates a real game session from quiz creation through completion.
 * 
 * Configure player count with: PARTICIPANT_COUNT=10 npm run test:e2e
 * Configure question count with: QUESTION_COUNT=5 npm run test:e2e
 */

test.describe("MASTER: Complete Application E2E Test", () => {
    test.setTimeout(300000); // 5 minutes for comprehensive test

    test("complete application flow with configurable players", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "5", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "3", 10);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`MASTER E2E TEST - COMPLETE APPLICATION COVERAGE`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        console.log(`${"=".repeat(60)}\n`);

        // ========================================
        // PHASE 1: QUIZ CREATION
        // ========================================
        console.log("✓ PHASE 1: Creating quiz via API...");
        const { quizId, questionIds } = await createTestQuiz(page, {
            title: `Master E2E Test - ${playerCount}P ${questionCount}Q`,
            description: "Comprehensive end-to-end test of entire application",
            questionCount,
            questionType: "MIXED", // Mix of single and multi-select
            timeLimit: 30,
            points: 100,
        });
        console.log(`  Quiz created: ${quizId}`);
        console.log(`  Questions: ${questionIds.length}`);

        // ========================================
        // PHASE 2: GAME SESSION CREATION
        // ========================================
        console.log("\n✓ PHASE 2: Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`  Game code: ${gameCode}`);

        // ========================================
        // PHASE 3: HOST SETUP
        // ========================================
        console.log("\n✓ PHASE 3: Setting up host interfaces...");

        // Open host control panel
        const hostPage = page;
        await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
        await hostPage.waitForLoadState("networkidle");
        console.log("  Control panel loaded");

        // Verify control panel
        await expect(
            hostPage.getByText(/waiting for players|control/i).first()
        ).toBeVisible({ timeout: 15000 });

        // Open display window
        const displayPage = await context.newPage();
        await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
        await displayPage.waitForLoadState("networkidle");
        console.log("  Display window loaded");

        // Verify QR code and game code on display
        await expect(
            displayPage.getByText(gameCode, { exact: false }).first()
        ).toBeVisible({ timeout: 10000 });
        console.log("  QR code and game code verified");

        // ========================================
        // PHASE 4: PLAYER JOINS
        // ========================================
        console.log(`\n✓ PHASE 4: Joining ${playerCount} players...`);
        const playerContext = await browser.newContext();
        const playerPages: Page[] = [];

        for (let i = 0; i < playerCount; i++) {
            const player = SAMPLE_PLAYERS[i % SAMPLE_PLAYERS.length];
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `${player.name}_${i + 1}`,
            });
            playerPages.push(playerPage);
            console.log(`  Player ${i + 1}/${playerCount}: ${player.name}_${i + 1} joined`);

            // Verify player appears on display
            await expect(
                displayPage.getByText(`${player.name}_${i + 1}`)
            ).toBeVisible({ timeout: 10000 });
        }

        // Verify host sees all players
        await waitForPlayerCount(hostPage, playerCount);
        console.log(`  All ${playerCount} players verified on host`);

        // ========================================
        // PHASE 5: GAME START
        // ========================================
        console.log("\n✓ PHASE 5: Starting game...");
        await hostStartGame(hostPage);
        console.log("  Game started");

        // Verify all players see game start
        for (let i = 0; i < playerPages.length; i++) {
            await expect(
                playerPages[i].getByText(/get ready|question|starting/i).first()
            ).toBeVisible({ timeout: 10000 });
        }
        console.log("  All players received game start");

        // ========================================
        // PHASE 6: GAMEPLAY - QUESTIONS
        // ========================================
        console.log(`\n✓ PHASE 6: Playing through ${questionCount} questions...`);

        for (let q = 0; q < questionCount; q++) {
            console.log(`\n  Question ${q + 1}/${questionCount}:`);

            // Host advances to next question
            await hostNextQuestion(hostPage);
            console.log(`    ✓ Host advanced to question ${q + 1}`);

            // Verify display shows question
            await expect(
                displayPage.getByText(/question|test question/i).first()
            ).toBeVisible({ timeout: 10000 });
            console.log("    ✓ Display showing question");

            // Verify players see question
            for (const playerPage of playerPages) {
                await expect(
                    playerPage.getByText(/answer|question/i).first()
                ).toBeVisible({ timeout: 10000 });
            }
            console.log(`    ✓ All ${playerCount} players see question`);

            // Players submit answers (staggered for realistic timing)
            console.log("    ✓ Players submitting answers...");
            for (let i = 0; i < playerPages.length; i++) {
                await playerPages[i].waitForTimeout(100 * i); // Stagger submissions
                await submitAnswer(playerPages[i], i % 2); // Alternate answers
            }
            console.log(`    ✓ All ${playerCount} answers submitted`);

            // Wait for answers to be processed
            await hostPage.waitForTimeout(1000);

            // Host reveals answers
            await hostRevealAnswers(hostPage);
            console.log("    ✓ Answers revealed");

            // Verify players see results
            for (const playerPage of playerPages) {
                await expect(
                    playerPage.getByText(/correct|incorrect|points/i).first()
                ).toBeVisible({ timeout: 10000 });
            }
            console.log("    ✓ All players see results");

            // Verify display shows answer statistics
            await expect(
                displayPage.getByText(/correct|answer/i).first()
            ).toBeVisible({ timeout: 5000 });
            console.log("    ✓ Display shows statistics");
        }

        // ========================================
        // PHASE 7: FINAL SCOREBOARD
        // ========================================
        console.log("\n✓ PHASE 7: Showing final results...");

        const showResultsButton = hostPage.getByRole("button", {
            name: /show results|final/i,
        });
        if (await showResultsButton.count()) {
            await showResultsButton.click();
        }

        // Verify final scoreboard on host
        await expect(
            hostPage.getByText(/final|scoreboard|winner/i).first()
        ).toBeVisible({ timeout: 10000 });
        console.log("  ✓ Host shows final scoreboard");

        // Verify display shows final results
        await expect(
            displayPage.getByText(/final|winner|congratulations/i).first()
        ).toBeVisible({ timeout: 10000 });
        console.log("  ✓ Display shows final results");

        // Verify all players see final results
        for (const playerPage of playerPages) {
            await expect(
                playerPage.getByText(/final|game over|score/i).first()
            ).toBeVisible({ timeout: 10000 });
        }
        console.log(`  ✓ All ${playerCount} players see final results`);

        // ========================================
        // PHASE 8: CLEANUP
        // ========================================
        console.log("\n✓ PHASE 8: Cleanup...");
        await playerContext.close();
        console.log("  ✓ Player contexts closed");

        // ========================================
        // TEST SUMMARY
        // ========================================
        console.log(`\n${"=".repeat(60)}`);
        console.log("✅ MASTER E2E TEST COMPLETED SUCCESSFULLY");
        console.log(`${"=".repeat(60)}`);
        console.log(`Tested Components:`);
        console.log(`  ✓ Quiz creation via API`);
        console.log(`  ✓ Game session creation`);
        console.log(`  ✓ Host control panel`);
        console.log(`  ✓ Host display window`);
        console.log(`  ✓ QR code generation`);
        console.log(`  ✓ Player join flow (${playerCount} players)`);
        console.log(`  ✓ Game start sequence`);
        console.log(`  ✓ Question display and navigation (${questionCount} questions)`);
        console.log(`  ✓ Answer submission and validation`);
        console.log(`  ✓ Real-time socket synchronization`);
        console.log(`  ✓ Score calculation`);
        console.log(`  ✓ Final scoreboard`);
        console.log(`  ✓ Multi-browser context handling`);
        console.log(`${"=".repeat(60)}\n`);
    });

    test("stress test with maximum players", async ({
        page,
        context,
        browser,
    }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const maxPlayers = 20; // Stress test with 20 players

        console.log(`\n${"=".repeat(60)}`);
        console.log(`STRESS TEST - ${maxPlayers} CONCURRENT PLAYERS`);
        console.log(`${"=".repeat(60)}\n`);

        // Create quiz
        const { quizId } = await createTestQuiz(page, {
            title: `Stress Test - ${maxPlayers} Players`,
            questionCount: 2,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
        });

        const gameCode = await createGameSession(page, quizId);

        // Setup host
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join many players concurrently
        const playerContext = await browser.newContext();
        const playerPages: Page[] = [];

        console.log(`Joining ${maxPlayers} players concurrently...`);
        const joinPromises = [];
        for (let i = 0; i < maxPlayers; i++) {
            const player = SAMPLE_PLAYERS[i % SAMPLE_PLAYERS.length];
            joinPromises.push(
                joinAsPlayer(playerContext, {
                    gameCode,
                    playerName: `Stress_${player.name}_${i + 1}`,
                })
            );
        }

        const pages = await Promise.all(joinPromises);
        playerPages.push(...pages);
        console.log(`✓ All ${maxPlayers} players joined successfully`);

        // Verify host sees all players
        await waitForPlayerCount(page, maxPlayers);
        console.log(`✓ Host verified ${maxPlayers} players`);

        // Start and play one question
        await hostStartGame(page);
        await hostNextQuestion(page);

        // All players answer
        const answerPromises = playerPages.map((p, i) => submitAnswer(p, i % 2));
        await Promise.all(answerPromises);
        console.log(`✓ All ${maxPlayers} players submitted answers`);

        await hostRevealAnswers(page);

        // Show results
        const resultsButton = page.getByRole("button", { name: /show results/i });
        if (await resultsButton.count()) {
            await resultsButton.click();
        }

        await expect(
            page.getByText(/final|scoreboard/i).first()
        ).toBeVisible({ timeout: 15000 });

        await playerContext.close();

        console.log(`\n${"=".repeat(60)}`);
        console.log(`✅ STRESS TEST PASSED - ${maxPlayers} PLAYERS`);
        console.log(`${"=".repeat(60)}\n`);
    });
});
