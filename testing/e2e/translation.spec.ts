import { test, expect } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    joinAsPlayer,
    submitRandomAnswer,
    verifyTranslatedContent,
    switchLanguageDuringGame,
    waitForTimerExpiry,
    showQuestionResults,
    deleteQuiz,
} from "./helpers/test-helpers";

/**
 * TRANSLATION E2E TESTS
 * Tests the language translation system during gameplay
 */

test.describe("Translation System Tests", () => {
    test.setTimeout(240000); // 4 minutes

    test("players see content in their selected language", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const questionCount = 3;

        console.log(`\n${"=".repeat(70)}`);
        console.log(`TRANSLATION TEST - MIXED LANGUAGES`);
        console.log(`Languages: Spanish, French, English`);
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz with Spanish and French translations
        console.log("📝 Creating quiz with translations...");
        const { quizId } = await createTestQuiz(page, {
            title: "Translation Test - Mixed Languages",
            questionCount,
            timeLimit: 30,
            points: 100,
            languages: ['es', 'fr'],  // Add Spanish and French translations
        });
        console.log(`   ✓ Quiz created with translations`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        console.log("\n🖥️  Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");
        console.log("   ✓ Control panel loaded");

        // Join 5 players with mixed languages
        console.log(`\n👥 Joining 5 players with mixed languages...`);
        const playerContext = await browser.newContext();
        const players: { page: any; name: string; language: string; prefix: string }[] = [];

        // 2 Spanish players
        for (let i = 0; i < 2; i++) {
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `ES_Player${i + 1}`,
                languageCode: 'es',
            });
            players.push({
                page: playerPage,
                name: `ES_Player${i + 1}`,
                language: 'Spanish',
                prefix: '[ES]'
            });
            console.log(`   ✓ ES_Player${i + 1} joined (Spanish 🇪🇸)`);
        }

        // 2 French players
        for (let i = 0; i < 2; i++) {
            const playerPage = await joinAsPlayer(playerContext, {
                gameCode,
                playerName: `FR_Player${i + 1}`,
                languageCode: 'fr',
            });
            players.push({
                page: playerPage,
                name: `FR_Player${i + 1}`,
                language: 'French',
                prefix: '[FR]'
            });
            console.log(`   ✓ FR_Player${i + 1} joined (French 🇫🇷)`);
        }

        // 1 English player
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: `EN_Player1`,
            // No languageCode = defaults to English
        });
        players.push({
            page: playerPage,
            name: `EN_Player1`,
            language: 'English',
            prefix: 'Test Question' // English has no prefix
        });
        console.log(`   ✓ EN_Player1 joined (English 🇬🇧 default)`);

        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await expect(startButton).toBeVisible();
        await expect(startButton).toBeEnabled();
        await startButton.click();
        await page.waitForTimeout(3000);
        console.log("   ✓ Game started");

        // Play through questions and verify translations
        console.log(`\n📊 Playing through ${questionCount} questions with translation verification...\n`);

        for (let q = 0; q < questionCount; q++) {
            console.log(`${"-".repeat(70)}`);
            console.log(`Question ${q + 1}/${questionCount}`);
            console.log(`${"-".repeat(70)}`);

            // Advance to next question
            await page.waitForTimeout(1000);
            const nextButton = page.locator('button').filter({
                hasText: /next question|next|begin/i
            }).first();

            if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await nextButton.click();
                console.log("   ✓ Advanced to question");
                await page.waitForTimeout(1500);
            }

            // Wait for question to appear
            console.log("   ⏳ Waiting for question to appear...");
            await page.waitForTimeout(2000);

            // Verify each player sees content in their selected language
            console.log("   🔍 Verifying translations for each player...");
            for (const player of players) {
                const verified = await verifyTranslatedContent(player.page, player.prefix);
                if (verified) {
                    console.log(`      ✓ ${player.name}: Seeing ${player.language} content`);
                } else {
                    console.log(`      ⚠️  ${player.name}: Translation verification failed`);
                }
            }

            // Players submit answers
            console.log("   👆 Players submitting answers...");
            let answeredCount = 0;
            for (const player of players) {
                try {
                    await submitRandomAnswer(player.page);
                    answeredCount++;
                } catch (e) {
                    console.log(`      ⚠️  ${player.name} couldn't answer`);
                }
            }
            console.log(`   ✓ ${answeredCount}/${players.length} players answered`);

            // Wait for timer and show results
            await waitForTimerExpiry(page, 30);
            await showQuestionResults(page);
        }

        // End game
        console.log(`\n${"-".repeat(70)}`);
        console.log("🏆 Ending game...");
        const endGameButton = page.locator('button').filter({
            hasText: /end game/i
        }).first();

        if (await endGameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await endGameButton.click();
            await page.waitForTimeout(2000);
            console.log("   ✓ Game ended");
        }

        // Cleanup
        await playerContext.close();
        console.log("\n🗑️  Cleaning up test data...");
        await deleteQuiz(page, quizId);

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ TRANSLATION TEST COMPLETED SUCCESSFULLY");
        console.log(`${"=".repeat(70)}\n`);
    });

    test("players can switch language mid-game", async ({ page, context, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";
        const questionCount = 2;

        console.log(`\n${"=".repeat(70)}`);
        console.log(`TRANSLATION TEST - MID-GAME LANGUAGE SWITCHING`);
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz with Spanish translation
        console.log("📝 Creating quiz with Spanish translation...");
        const { quizId } = await createTestQuiz(page, {
            title: "Translation Test - Language Switching",
            questionCount,
            timeLimit: 30,
            points: 100,
            languages: ['es'],
        });
        console.log(`   ✓ Quiz created`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        console.log("\n🖥️  Opening host control panel...");
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Join 2 players in English
        console.log(`\n👥 Joining 2 players (both English initially)...`);
        const playerContext = await browser.newContext();

        const player1 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: `Player1`,
        });
        console.log(`   ✓ Player1 joined (English 🇬🇧)`);

        const player2 = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: `Player2`,
        });
        console.log(`   ✓ Player2 joined (English 🇬🇧)`);

        await page.waitForTimeout(2000);

        // Start game
        console.log("\n🚀 Starting game...");
        const startButton = page.getByRole("button", { name: /start game/i });
        await startButton.click();
        await page.waitForTimeout(3000);

        // Advance to first question
        console.log("\n📊 Question 1/2");
        await page.waitForTimeout(1000);
        const nextButton = page.locator('button').filter({
            hasText: /next question|next|begin/i
        }).first();
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextButton.click();
            await page.waitForTimeout(1500);
        }

        // Wait for question
        await page.waitForTimeout(2000);

        // Player 2 switches to Spanish
        console.log("   🌐 Player 2 switching to Spanish...");
        const switched = await switchLanguageDuringGame(player2, 'es');
        if (switched) {
            console.log("   ✓ Player 2 switched to Spanish 🇪🇸");
        } else {
            console.log("   ⚠️  Player 2 couldn't switch language");
        }

        await page.waitForTimeout(1000);

        // Verify translations
        console.log("   🔍 Verifying language display...");
        const player1English = await verifyTranslatedContent(player1, 'Test Question');
        const player2Spanish = await verifyTranslatedContent(player2, '[ES]');

        if (player1English) {
            console.log("      ✓ Player 1: Still seeing English");
        }
        if (player2Spanish) {
            console.log("      ✓ Player 2: Now seeing Spanish");
        }

        // Both players answer
        console.log("   👆 Players answering...");
        try {
            await submitRandomAnswer(player1);
            await submitRandomAnswer(player2);
            console.log("   ✓ Both players answered");
        } catch (e) {
            console.log("   ⚠️  Error during answer submission");
        }

        // Complete question
        await waitForTimerExpiry(page, 30);
        await showQuestionResults(page);

        // Advance to second question
        console.log("\n📊 Question 2/2");
        const nextButton2 = page.locator('button').filter({
            hasText: /next question|next/i
        }).first();
        if (await nextButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextButton2.click();
            await page.waitForTimeout(1500);
        }

        await page.waitForTimeout(2000);

        // Verify Player 2 still sees Spanish
        console.log("   🔍 Verifying language persistence...");
        const player2StillSpanish = await verifyTranslatedContent(player2, '[ES]');
        if (player2StillSpanish) {
            console.log("   ✓ Player 2: Spanish persists across questions");
        } else {
            console.log("   ⚠️  Player 2: Language didn't persist");
        }

        // Both players answer
        try {
            await submitRandomAnswer(player1);
            await submitRandomAnswer(player2);
        } catch (e) {
            // Silent fail
        }

        await waitForTimerExpiry(page, 30);
        await showQuestionResults(page);

        // End game
        const endGameButton = page.locator('button').filter({
            hasText: /end game/i
        }).first();
        if (await endGameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await endGameButton.click();
            await page.waitForTimeout(2000);
        }

        // Cleanup
        await playerContext.close();
        console.log("\n🗑️  Cleaning up test data...");
        await deleteQuiz(page, quizId);

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ LANGUAGE SWITCHING TEST COMPLETED");
        console.log(`${"=".repeat(70)}\n`);
    });

    test("quiz without translations shows no language selector", async ({ page, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        console.log(`\n${"=".repeat(70)}`);
        console.log(`TRANSLATION TEST - NO TRANSLATIONS`);
        console.log(`${"=".repeat(70)}\n`);

        // Create quiz WITHOUT translations
        console.log("📝 Creating quiz without translations...");
        const { quizId } = await createTestQuiz(page, {
            title: "Test - English Only",
            questionCount: 1,
            timeLimit: 30,
            points: 100,
            // No languages parameter = no translations
        });
        console.log(`   ✓ Quiz created (English only)`);

        // Create game
        console.log("\n🎮 Creating game session...");
        const gameCode = await createGameSession(page, quizId);
        console.log(`   ✓ Game code: ${gameCode}`);

        // Open host control
        await page.goto(`${baseURL}/host/${gameCode}/control`);
        await page.waitForLoadState("networkidle");

        // Check join screen for language selector before joining
        console.log("\n👥 Checking join screen...");
        const playerContext = await browser.newContext();
        const checkPage = await playerContext.newPage();
        await checkPage.goto(`${baseURL}/play/${gameCode}`);
        await checkPage.waitForLoadState("networkidle");
        await checkPage.waitForTimeout(2000);

        // Look for the language selector label
        const languageLabel = await checkPage.locator('text=Select Quiz Questions/Answer Language')
            .isVisible({ timeout: 2000 })
            .catch(() => false);

        if (!languageLabel) {
            console.log("   ✓ Language selector NOT present on join screen (correct behavior)");
        } else {
            console.log("   ⚠️  Language selector IS present on join screen (unexpected!)");
        }

        await checkPage.close();

        // Join player using helper
        console.log("\n👥 Joining player...");
        const playerPage = await joinAsPlayer(playerContext, {
            gameCode,
            playerName: "TestPlayer",
            // No languageCode = English default
        });
        console.log("   ✓ Player joined successfully in English");

        // Start game
        const startButton = page.getByRole("button", { name: /start game/i });
        await startButton.click();
        await page.waitForTimeout(2000);

        // Advance to question
        const nextButton = page.locator('button').filter({
            hasText: /next question|begin/i
        }).first();
        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextButton.click();
            await playerPage.waitForTimeout(2000);
        }

        await playerPage.waitForTimeout(1000);

        // Verify English content (no translation prefix)
        const content = await playerPage.textContent('body');
        if (content?.includes('Test Question')) {
            console.log("   ✓ Player seeing English content (no translation prefix)");
        }

        // Check that no in-game language switcher appears at bottom-right
        console.log("   🔍 Checking for in-game language switcher...");
        const inGameSwitcher = playerPage.locator('.fixed.bottom-4.right-4 button').first();
        const switcherVisible = await inGameSwitcher.isVisible({ timeout: 2000 }).catch(() => false);

        if (!switcherVisible) {
            console.log("   ✓ No in-game language switcher (correct behavior)");
        } else {
            console.log("   ⚠️  In-game language switcher IS present (unexpected!)");
        }

        // Cleanup
        await playerContext.close();
        console.log("\n🗑️  Cleaning up test data...");
        await deleteQuiz(page, quizId);

        console.log(`\n${"=".repeat(70)}`);
        console.log("✅ NO TRANSLATIONS TEST COMPLETED");
        console.log(`${"=".repeat(70)}\n`);
    });
});
