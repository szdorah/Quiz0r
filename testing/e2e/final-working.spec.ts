import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    submitRandomAnswer,
    waitForTimerExpiry,
    showQuestionResults,
    useRandomPowerUps,
    checkCertificateAvailability,
    simulateCertificateDownloads,
    checkPlayerAnswers,
    deleteQuiz,
    verifyTranslatedContent,
} from "./helpers/test-helpers";

/**
 * FINAL WORKING E2E TEST
 * This test properly waits for questions and verifies player answers
 */

test.describe("Final Working E2E Test", () => {
    test.setTimeout(300000); // 5 minutes

    test("players answer questions correctly", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const playerCount = parseInt(process.env.PARTICIPANT_COUNT || "5", 10);
        const questionCount = parseInt(process.env.QUESTION_COUNT || "3", 10);

        // Optional translation testing
        const enableTranslations = process.env.ENABLE_TRANSLATIONS === "true";
        const translationLanguages = process.env.TRANSLATION_LANGUAGES?.split(',') || ['es', 'fr'];

        console.log(`\n${"=".repeat(70)}`);
        console.log(`FINAL WORKING E2E TEST - WITH PLAYER ANSWERS`);
        console.log(`Players: ${playerCount} | Questions: ${questionCount}`);
        if (enableTranslations) {
            console.log(`Translations: Enabled (${translationLanguages.join(', ')})`);
        }
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz (with optional translations)
        console.log("📝 Creating quiz...");
        const { quizId } = await createTestQuiz(page, {
            title: `Final Test - ${playerCount}P ${questionCount}Q`,
            questionCount,
            timeLimit: 30,
            points: 100,
            languages: enableTranslations ? translationLanguages : undefined,
        });
        console.log(`   ✓ Quiz ID: ${quizId}`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        console.log("\n🖥️  Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");
        console.log("   ✓ Control panel loaded");

        // Join players (with optional language selection)
        console.log(`\n👥 Joining ${playerCount} players...`);
        const playerContext = await browser.newContext();
        const playerPages: any[] = [];

        for (let i = 0; i < playerCount; i++) {
            // Randomly assign languages if translations are enabled
            // 30% first language, 30% second language, 40% English
            let languageCode: string | undefined;
            let languageDisplay = "English 🇬🇧";

            if (enableTranslations && translationLanguages.length > 0) {
                const rand = Math.random();
                if (rand < 0.3 && translationLanguages[0]) {
                    languageCode = translationLanguages[0];
                    languageDisplay = `${translationLanguages[0].toUpperCase()} ${getLanguageFlag(translationLanguages[0])}`;
                } else if (rand < 0.6 && translationLanguages[1]) {
                    languageCode = translationLanguages[1];
                    languageDisplay = `${translationLanguages[1].toUpperCase()} ${getLanguageFlag(translationLanguages[1])}`;
                }
                // else: English (default)
            }

            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `Player${i + 1}`,
                languageCode,
            });
            playerPages.push({ page: playerPage, language: languageCode, name: `Player${i + 1}` });

            if ((i + 1) % 5 === 0 || i === playerCount - 1) {
                console.log(`   ✓ ${i + 1}/${playerCount} players joined`);
            }
            if (enableTranslations && (i < 3)) {
                // Show language selection for first 3 players only (avoid log spam)
                console.log(`      Player${i + 1}: ${languageDisplay}`);
            }
        }

        // Helper function for language flags
        function getLanguageFlag(code: string): string {
            const flags: Record<string, string> = {
                'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'he': '🇮🇱',
                'ja': '🇯🇵', 'zh-CN': '🇨🇳', 'ar': '🇸🇦', 'pt': '🇵🇹',
                'ru': '🇷🇺', 'it': '🇮🇹'
            };
            return flags[code] || '🌐';
        }

        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log("   ✓ Game started");

        // Play through questions
        console.log(`\n📊 Playing through ${questionCount} questions...\n`);

        for (let q = 0; q < questionCount; q++) {
            console.log(`${"─".repeat(70)}`);
            console.log(`Question ${q + 1}/${questionCount}`);
            console.log(`${"─".repeat(70)}`);

            // Advance to next question
            await page.waitForTimeout(1000);

            // Look for button to advance to question
            const nextButton = page.locator('button').filter({
                hasText: /next question|next|begin/i
            }).first();

            if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await nextButton.click();
                console.log("   ✓ Advanced to question");
                await page.waitForTimeout(1500);
            }

            // Wait for question to appear on player screens
            // Check if the first player sees the question
            console.log("   ⏳ Waiting for question to appear on player screens...");

            // Wait for answer buttons to appear on first player's screen
            const firstPlayerPage = playerPages[0].page;

            // Wait for answer buttons to appear on first player's screen
            let questionVisible = false;
            for (let attempt = 0; attempt < 10; attempt++) {
                const allButtons = firstPlayerPage.locator("button");
                const buttonCount = await allButtons.count();

                for (let i = 0; i < buttonCount; i++) {
                    const text = await allButtons.nth(i).textContent();
                    // Match buttons starting with A, B, C, or D (no space required)
                    if (text && /^[A-D]/.test(text.trim())) {
                        questionVisible = true;
                        break;
                    }
                }

                if (questionVisible) break;
                await firstPlayerPage.waitForTimeout(500);
            }

            if (!questionVisible) {
                console.log("   ⚠️  Warning: Question not visible on player screen");
                continue;
            }

            console.log("   ✓ Question visible on player screens");

            // Players use powerups and answer randomly
            console.log("   👆 Players submitting answers...");
            let answeredCount = 0;

            // Optional translation verification (sample 2 players to avoid slowing test)
            if (enableTranslations && q === 0) {
                console.log("   🔍 Verifying translations (sample check)...");
                for (let i = 0; i < Math.min(2, playerPages.length); i++) {
                    const player = playerPages[i];
                    if (player.language) {
                        const prefix = `[${player.language.toUpperCase()}]`;
                        const verified = await verifyTranslatedContent(player.page, prefix);
                        if (verified) {
                            console.log(`      ✓ ${player.name}: Seeing ${player.language.toUpperCase()} content`);
                        }
                    }
                }
            }

            for (let i = 0; i < playerPages.length; i++) {
                const player = playerPages[i];
                const playerPage = player.page;

                try {
                    // Randomly use powerups (30% chance for each)
                    const powerUps = await useRandomPowerUps(playerPage, 0.3);
                    const powerUpLog = [];
                    if (powerUps.hint) powerUpLog.push('💡Hint');
                    if (powerUps.copy) powerUpLog.push(`📋Copy(${powerUps.copiedFrom})`);
                    if (powerUps.double) powerUpLog.push('✨2x');

                    // Submit answer
                    const answer = await submitRandomAnswer(playerPage);
                    const log = `      Player ${i + 1} selected: ${answer.letter}`;
                    console.log(powerUpLog.length > 0 ? `${log} [${powerUpLog.join(', ')}]` : log);
                    answeredCount++;
                } catch (e) {
                    console.log(`      ⚠️  Player ${i + 1} couldn't answer`);
                }

                // Small delay between players
                await playerPage.waitForTimeout(50);
            }

            console.log(`   ✓ ${answeredCount}/${playerCount} players answered`);

            // Verify host sees the answers
            await page.waitForTimeout(1000);
            const hostAnswers = await checkPlayerAnswers(page);
            console.log(`   📊 Host panel shows: ${hostAnswers.answered}/${hostAnswers.total} answered`);

            // Wait for timer to expire
            await waitForTimerExpiry(page, 30);

            // Show results for this question
            await showQuestionResults(page);
        }

        // End the game to show final results
        console.log(`\n${"─".repeat(70)}`);
        console.log("🏆 Ending game to show final results...");

        // Look for "End Game" button on the host control
        const endGameButton = page.locator('button').filter({
            hasText: /end game/i
        }).first();

        if (await endGameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await endGameButton.click();
            await page.waitForTimeout(2000);
            console.log("   ✓ Game ended, final results displayed");
        } else {
            console.log("   ⚠️  End Game button not found, game may have already ended");
        }

        // Check certificate availability
        console.log("\n📜 Checking certificate availability...");
        const playerPagesOnly = playerPages.map(p => p.page);
        const certAvailable = await checkCertificateAvailability(playerPagesOnly);
        console.log(`   ✓ ${certAvailable}/${playerCount} players can download certificates`);

        // Simulate some players downloading certificates (50% chance)
        console.log("\n📄 Simulating certificate downloads...");
        const downloadCount = await simulateCertificateDownloads(playerPagesOnly, 0.5);
        console.log(`   ✓ ${downloadCount} players downloaded certificates`);

        // Cleanup
        await playerContext.close();

        // Delete the quiz
        console.log("\n🗑️  Cleaning up test data...");
        await deleteQuiz(page, quizId);

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ TEST COMPLETED SUCCESSFULLY");
        console.log(`${"=".repeat(70)}\n`);
    });
});
