import { test } from "@playwright/test";
import {
    createTestQuiz,
    createGameSession,
    deleteQuiz,
} from "./helpers/test-helpers";

/**
 * DEBUG TEST: Inspect language selector HTML structure
 */

test.describe("Debug Language Selector", () => {
    test.setTimeout(60000);

    test("inspect language selector options", async ({ page, browser }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        console.log("\n====== DEBUG: Language Selector Structure ======\n");

        // Create quiz with translations
        console.log("1. Creating quiz with translations...");
        const { quizId } = await createTestQuiz(page, {
            title: "Debug Selector Test",
            questionCount: 1,
            languages: ['es', 'fr'],
        });

        // Create game session
        const gameCode = await createGameSession(page, quizId);
        console.log(`   Game code: ${gameCode}`);

        // Open join page in new context
        const playerContext = await browser.newContext();
        const playerPage = await playerContext.newPage();

        await playerPage.goto(`${baseURL}/play/${gameCode}`);
        await playerPage.waitForLoadState("networkidle");
        await playerPage.waitForTimeout(2000);

        // Fill in name
        console.log("\n2. Filling in player details...");
        await playerPage.locator('input[name="name"]').fill("TestPlayer");
        await playerPage.getByRole("button", { name: /😀/ }).first().click();

        // Wait for language selector to appear
        console.log("\n3. Waiting for language selector...");
        await playerPage.waitForTimeout(2000);

        const labelVisible = await playerPage.locator('text=Select Quiz Questions/Answer Language')
            .isVisible()
            .catch(() => false);

        console.log(`   Label visible: ${labelVisible}`);

        if (!labelVisible) {
            console.log("   ❌ Language selector not found!");
            await playerContext.close();
            await deleteQuiz(page, quizId);
            return;
        }

        // Click the selector to open dropdown
        console.log("\n4. Opening language dropdown...");
        const selectTrigger = playerPage.locator('button[role="combobox"]').first();
        await selectTrigger.click();
        await playerPage.waitForTimeout(1500);

        // Inspect the dropdown structure
        console.log("\n5. Inspecting dropdown options...");

        const allOptions = playerPage.locator('[role="option"]');
        const count = await allOptions.count();
        console.log(`   Found ${count} options`);

        for (let i = 0; i < count; i++) {
            const option = allOptions.nth(i);
            const text = await option.textContent();
            const value = await option.getAttribute('data-value');
            const ariaSelected = await option.getAttribute('aria-selected');
            const innerHTML = await option.innerHTML();

            console.log(`\n   Option ${i + 1}:`);
            console.log(`      Text: "${text}"`);
            console.log(`      data-value: "${value}"`);
            console.log(`      aria-selected: "${ariaSelected}"`);
            console.log(`      HTML: ${innerHTML.substring(0, 150)}...`);
        }

        // Cleanup
        await playerContext.close();
        await deleteQuiz(page, quizId);

        console.log("\n====== DEBUG COMPLETE ======\n");
    });
});
