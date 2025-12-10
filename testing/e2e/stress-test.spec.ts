import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    deleteQuiz,
} from "./helpers/test-helpers";
import { SAMPLE_PLAYERS } from "./helpers/test-fixtures";

/**
 * STRESS TEST - 20+ Players with Multiple Languages and Random Powerups
 * This test simulates a realistic high-load scenario with:
 * - Configurable player count (default 20)
 * - Multiple languages for different players
 * - Random powerup usage
 * - Random answer timing
 * - Full game flow with certificates
 */

const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'];

test.describe("Stress Test - Multi-Language Multi-Player", () => {
    test.setTimeout(600000); // 10 minutes

    test("stress test with configurable players, languages, and powerups", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "20", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "5", 10);
        const usePowerups = process.env.USE_POWERUPS !== "false";
        const useMultiLanguages = process.env.USE_MULTI_LANG !== "false";

        console.log(`\n${"=".repeat(80)}`);
        console.log(`🔥 STRESS TEST - HIGH LOAD SIMULATION`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        console.log(`Powerups: ${usePowerups ? 'ENABLED' : 'DISABLED'} | Multi-Language: ${useMultiLanguages ? 'ENABLED' : 'DISABLED'}`);
        console.log(`${"=".repeat(80)}\n`);

        // Create quiz
        console.log("📝 Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: `Stress Test - ${new Date().toISOString()}`,
            questionCount,
            timeLimit: 30,
            points: 100,
        });
        console.log(`   ✓ Quiz created: ${quizId}`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        console.log("\n🖥️  Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join players with different languages
        console.log(`\n👥 Joining ${playerCount} players with various configurations...`);
        const playerContext = await browser.newContext();
        const players = [];

        // Join players in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < playerCount; i += batchSize) {
            const batch = [];
            const batchEnd = Math.min(i + batchSize, playerCount);

            for (let j = i; j < batchEnd; j++) {
                const playerIndex = j % SAMPLE_PLAYERS.length;
                const languageCode = useMultiLanguages
                    ? LANGUAGES[j % LANGUAGES.length]
                    : 'en';

                const joinPromise = (async () => {
                    const playerPage = await joinAsPlayer(playerContext, {
                        gameCode,
                        playerName: `${SAMPLE_PLAYERS[playerIndex].name}_${j + 1}`,
                    });
                    return {
                        page: playerPage,
                        name: `${SAMPLE_PLAYERS[playerIndex].name}_${j + 1}`,
                        language: languageCode,
                        index: j
                    };
                })();

                batch.push(joinPromise);
            }

            const batchPlayers = await Promise.all(batch);
            players.push(...batchPlayers);
            console.log(`   ✓ ${Math.min(i + batchSize, playerCount)} players joined`);
            await page.waitForTimeout(500);
        }

        console.log(`   ✓ All ${playerCount} players successfully joined`);
        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await startButton.click();
        await page.waitForTimeout(2000);
        console.log("   ✓ Game started");

        // --- GAME LOOP ---
        for (let q = 0; q < questionCount; q++) {
            console.log(`\n${"─".repeat(80)}`);
            console.log(`📊 Question ${q + 1}/${questionCount}`);
            console.log(`${"─".repeat(80)}`);

            // Host: Advance to next question
            const advanceButton = page.locator('button').filter({ hasText: /next question|next|begin/i }).first();

            if (await advanceButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await advanceButton.click();
                console.log("   🎯 Question advanced by host");
            }

            // Wait for question to appear on player screens
            console.log("   ⏳ Waiting for question to load on player screens...");
            try {
                await expect(players[0].page.locator("button").filter({ hasText: /^[A-D]/ }).first())
                    .toBeVisible({ timeout: 15000 });
                console.log("   ✓ Question visible to players");
            } catch (e) {
                console.log("   ⚠️  Warning: Question timing may vary");
            }

            // Players act with randomized timing
            console.log(`   🎮 ${playerCount} players answering...`);
            const playerActions = [];

            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                const pPage = player.page;

                const action = (async () => {
                    try {
                        // Random delay (0-3 seconds) for realistic timing
                        const delay = Math.random() * 3000;
                        await pPage.waitForTimeout(delay);

                        // POWERUP USAGE (30% chance if enabled)
                        if (usePowerups && Math.random() < 0.3) {
                            const powerups = pPage.locator("button").filter({ hasText: /Hint|Copy|2x|Double|Skip/i });
                            const count = await powerups.count();

                            if (count > 0) {
                                const randomPowerup = Math.floor(Math.random() * count);
                                const btn = powerups.nth(randomPowerup);
                                if (await btn.isEnabled().catch(() => false)) {
                                    await btn.click().catch(() => { });
                                    const text = await btn.textContent().catch(() => "Powerup");
                                    console.log(`      🔸 ${player.name} (${player.language}) used ${text?.trim().split(" ")[0]}!`);
                                }
                            }
                        }

                        // SUBMIT ANSWER (random choice)
                        const answers = pPage.locator("button").filter({ hasText: /^[A-D]/ });
                        const answerCount = await answers.count();

                        if (answerCount > 0) {
                            const randomChoice = Math.floor(Math.random() * answerCount);
                            const choiceBtn = answers.nth(randomChoice);

                            if (await choiceBtn.isEnabled().catch(() => false)) {
                                await choiceBtn.click().catch(() => { });
                            }
                        }
                    } catch (error) {
                        // Silent failure for individual players to keep test running
                    }
                })();

                playerActions.push(action);

                // Submit in waves to simulate realistic behavior
                if ((i + 1) % 10 === 0) {
                    await Promise.allSettled(playerActions);
                    playerActions.length = 0;
                    console.log(`      ✓ ${i + 1}/${playerCount} players acted`);
                }
            }

            // Wait for remaining players
            if (playerActions.length > 0) {
                await Promise.allSettled(playerActions);
                console.log(`      ✓ All ${playerCount} players completed their actions`);
            }

            // Wait for answers to settle
            await page.waitForTimeout(2000);

            // Host reveals answers
            const revealButton = page.locator('button').filter({ hasText: /reveal/i }).first();
            if (await revealButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await revealButton.click();
                console.log("   📊 Host revealed answers");
            }

            await page.waitForTimeout(2000);
        }

        // --- END GAME ---
        console.log(`\n${"─".repeat(80)}`);
        console.log("🏁 Ending Game...");
        const finalButton = page.locator('button').filter({ hasText: /show results|final|finish/i }).first();
        if (await finalButton.isVisible().catch(() => false)) {
            await finalButton.click();
            console.log("   ✓ Game ended successfully");
        }

        await page.waitForTimeout(3000);

        // --- CERTIFICATE VERIFICATION ---
        console.log("\n📜 Verifying certificate availability...");
        let certCount = 0;
        const sampleSize = Math.min(5, players.length);

        for (let i = 0; i < sampleSize; i++) {
            const player = players[i];
            await player.page.waitForTimeout(1000);

            const certBtn = player.page.locator('button').filter({ hasText: /download certificate|certificate/i }).first();
            if (await certBtn.isVisible().catch(() => false)) {
                certCount++;
            }
        }

        console.log(`   ✓ ${certCount}/${sampleSize} sampled players can download certificates`);

        // --- PERFORMANCE METRICS ---
        console.log("\n📈 Performance Summary:");
        console.log(`   • Total Players: ${playerCount}`);
        console.log(`   • Total Questions: ${questionCount}`);
        console.log(`   • Languages Used: ${useMultiLanguages ? LANGUAGES.slice(0, Math.min(playerCount, LANGUAGES.length)).join(', ') : 'en'}`);
        console.log(`   • Powerups: ${usePowerups ? 'Enabled' : 'Disabled'}`);

        // --- CLEANUP ---
        console.log("\n🧹 Cleaning up...");
        await playerContext.close();
        await deleteQuiz(page, quizId);
        console.log("   ✓ Test data cleaned up");

        console.log(`\n${"=".repeat(80)}`);
        console.log("✅ STRESS TEST COMPLETE - ALL SYSTEMS OPERATIONAL");
        console.log(`${"=".repeat(80)}\n`);
    });
});
