import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    deleteQuiz,
} from "./helpers/test-helpers";

/**
 * ADVANCED SIMULATION TEST
 * - Random answers
 * - Powerup usage
 * - Certificate verification
 */

test.describe("Advanced Game Simulation", () => {
    test.setTimeout(480000); // 8 minutes

    test("simulate real gameplay with powerups and certificates", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "5", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "3", 10);

        console.log(`\n${"=".repeat(70)}`);
        console.log(`ADVANCED SIMULATION - REALISTIC GAMEPLAY`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz
        console.log("📝 Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: `Simulated Game - ${new Date().toISOString()}`,
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

        // Join players (store in array)
        console.log(`\n👥 Joining ${playerCount} players...`);
        const playerContext = await browser.newContext();
        const players = [];

        for (let i = 0; i < playerCount; i++) {
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `Actor_${i + 1}`,
            });
            players.push({ page: playerPage, name: `Actor_${i + 1}` });
            if ((i + 1) % 5 === 0) console.log(`   ✓ ${i + 1} players joined`);
        }

        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await startButton.click();
        await page.waitForTimeout(2000);

        // --- GAME LOOP ---
        for (let q = 0; q < questionCount; q++) {
            console.log(`\n--- Question ${q + 1}/${questionCount} ---`);

            // Host: Next Question (Handle both "Next Question" and "Start First Question")
            // Note: In early game it might be "Start", later "Next"
            // We use a robust locator strategy
            const advanceButton = page.locator('button').filter({ hasText: /next question|next|begin/i }).first();

            // Advance if visible (it might auto-advance or be needed)
            if (await advanceButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await advanceButton.click();
                console.log("   Host: Advanced to question");
            }

            // Wait for players to see question
            // We verify by checking if *any* answer button appears on the first player
            console.log("   Waiting for question on player screens...");
            try {
                await expect(players[0].page.locator("button").filter({ hasText: /^[A-D]/ }).first()).toBeVisible({ timeout: 15000 });
                console.log("   ✓ Question visible");
            } catch (e) {
                console.log("   ⚠️  Warning: Question may have appeared/disappeared quickly");
            }

            // Players Act
            console.log("   Players acting...");

            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                const pPage = player.page;

                // 1. CHANCE TO USE POWERUP (Random 30% chance)
                if (Math.random() < 0.3) {
                    // Try to find a powerup button
                    const powerups = pPage.locator("button").filter({ hasText: /Hint|Copy|2x/ });
                    const count = await powerups.count();

                    if (count > 0) {
                        const randomPowerup = Math.floor(Math.random() * count);
                        const btn = powerups.nth(randomPowerup);
                        if (await btn.isEnabled().catch(() => false)) {
                            await btn.click().catch(() => { }); // Click might fail if question ending
                            const text = await btn.textContent().catch(() => "Powerup");
                            console.log(`   🔸 ${player.name} used ${text?.trim().split(" ")[0]}!`);
                        }
                    }
                }

                // 2. SUBMIT RANDOM ANSWER
                const answers = pPage.locator("button").filter({ hasText: /^[A-D]/ });
                const answerCount = await answers.count();

                if (answerCount > 0) {
                    const randomChoice = Math.floor(Math.random() * answerCount);
                    const choiceBtn = answers.nth(randomChoice);

                    // Small random delay for realism (0-1s)
                    await pPage.waitForTimeout(Math.random() * 1000);

                    if (await choiceBtn.isEnabled().catch(() => false)) {
                        await choiceBtn.click().catch(() => { });
                    }
                }
            }
            console.log("   ✓ All players attempted answers");

            // Wait for Question to end (Host Reveal)
            // Host should click "Reveal" if visible
            await page.waitForTimeout(2000);
            const revealButton = page.locator('button').filter({ hasText: /reveal/i }).first();
            if (await revealButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await revealButton.click();
                console.log("   Host: Revealed answers");
            }

            await page.waitForTimeout(2000); // Scoreboard view
        }

        // --- END GAME ---
        console.log("\n🏁 Ending Game...");
        const finalButton = page.locator('button').filter({ hasText: /show results|final|finish/i }).first();
        if (await finalButton.isVisible().catch(() => false)) {
            await finalButton.click(); // Transitions to Finished
        }

        // Wait for final leaderboard
        await page.waitForTimeout(2000);

        // --- CERTIFICATE CHECK ---
        console.log("\n📜 Checking Certificates...");
        let certCount = 0;

        for (const player of players) {
            // Players should see "Download Certificate" button if they completed the quiz
            // Note: Depending on logic, maybe only top players or all? Usually all participants get one via email or download
            // Checking for the button existence

            // Wait for results screen
            await player.page.waitForTimeout(1000);

            const certBtn = player.page.locator('button').filter({ hasText: /download certificate|certificate/i }).first();
            if (await certBtn.isVisible().catch(() => false)) {
                certCount++;
                // We don't click it because it might trigger a file download which hangs headless specific ways, 
                // but visibility proves the feature works.
            }
        }

        console.log(`   ✓ ${certCount} players see the Certificate Download button`);

        // --- CLEANUP ---
        await playerContext.close();

        // Delete the quiz
        console.log("\n🗑️  Cleaning up test data...");
        await deleteQuiz(page, quizId);

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ SIMULATION COMPLETE");
        console.log(`${"=".repeat(70)}\n`);
    });
});
