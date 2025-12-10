import { test, expect } from "@playwright/test";

test.describe("Quiz Management - Admin Panel", () => {
    test.setTimeout(120000);

    test("create new quiz via UI", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Navigate to admin panel
        await page.goto(`${baseURL}/admin`);
        await page.waitForLoadState("networkidle");

        // Click "New Quiz" button
        const newQuizButton = page.getByRole("button", { name: /new quiz|create/i });
        await newQuizButton.click();

        // Fill in quiz details
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
        await titleInput.fill("E2E Test Quiz via UI");

        const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
        if (await descInput.count()) {
            await descInput.fill("Created via E2E test");
        }

        // Save quiz
        const saveButton = page.getByRole("button", { name: /save|create/i });
        await saveButton.click();

        // Verify quiz was created
        await expect(
            page.getByText("E2E Test Quiz via UI")
        ).toBeVisible({ timeout: 10000 });
    });

    test("add question to quiz via UI", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz via API for speed
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Question Test Quiz", description: "For testing questions" },
        });
        const quiz = await quizRes.json();

        // Navigate to quiz questions page
        await page.goto(`${baseURL}/admin/quiz/${quiz.id}/questions`);
        await page.waitForLoadState("networkidle");

        // Click "Add Question" button
        const addButton = page.getByRole("button", { name: /add question|new question/i });
        await addButton.click();

        // Fill in question details
        const questionInput = page.locator('input[name="questionText"], textarea[name="questionText"]').first();
        await questionInput.fill("What is the capital of France?");

        // Add answers
        const answerInputs = page.locator('input[placeholder*="answer" i]');
        const count = await answerInputs.count();

        if (count >= 2) {
            await answerInputs.nth(0).fill("Paris");
            await answerInputs.nth(1).fill("London");

            // Mark first answer as correct
            const correctCheckbox = page.locator('input[type="checkbox"]').first();
            if (await correctCheckbox.count()) {
                await correctCheckbox.check();
            }
        }

        // Save question
        const saveButton = page.getByRole("button", { name: /save|add/i });
        await saveButton.click();

        // Verify question appears in list
        await expect(
            page.getByText("What is the capital of France?")
        ).toBeVisible({ timeout: 10000 });
    });

    test("edit existing question", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz with question via API
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Edit Test Quiz" },
        });
        const quiz = await quizRes.json();

        const questionRes = await page.request.post(
            `${baseURL}/api/quizzes/${quiz.id}/questions`,
            {
                data: {
                    questionText: "Original Question",
                    questionType: "SINGLE_SELECT",
                    timeLimit: 30,
                    points: 100,
                    answers: [
                        { answerText: "Answer A", isCorrect: true },
                        { answerText: "Answer B", isCorrect: false },
                    ],
                },
            }
        );

        // Navigate to quiz
        await page.goto(`${baseURL}/admin/quiz/${quiz.id}/questions`);
        await page.waitForLoadState("networkidle");

        // Click edit button
        const editButton = page.getByRole("button", { name: /edit/i }).first();
        await editButton.click();

        // Modify question text
        const questionInput = page.locator('input[name="questionText"], textarea[name="questionText"]').first();
        await questionInput.fill("Modified Question");

        // Save
        const saveButton = page.getByRole("button", { name: /save/i });
        await saveButton.click();

        // Verify change
        await expect(
            page.getByText("Modified Question")
        ).toBeVisible({ timeout: 10000 });
    });

    test("delete question from quiz", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz with question via API
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Delete Test Quiz" },
        });
        const quiz = await quizRes.json();

        await page.request.post(
            `${baseURL}/api/quizzes/${quiz.id}/questions`,
            {
                data: {
                    questionText: "Question to Delete",
                    questionType: "SINGLE_SELECT",
                    timeLimit: 30,
                    points: 100,
                    answers: [
                        { answerText: "Answer A", isCorrect: true },
                    ],
                },
            }
        );

        // Navigate to quiz
        await page.goto(`${baseURL}/admin/quiz/${quiz.id}/questions`);
        await page.waitForLoadState("networkidle");

        // Verify question exists
        await expect(
            page.getByText("Question to Delete")
        ).toBeVisible({ timeout: 10000 });

        // Click delete button
        const deleteButton = page.getByRole("button", { name: /delete|remove/i }).first();
        await deleteButton.click();

        // Confirm deletion if dialog appears
        const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
        if (await confirmButton.count()) {
            await confirmButton.click();
        }

        // Verify question is gone
        await page.waitForTimeout(1000);
        const questionExists = await page.getByText("Question to Delete").count();
        expect(questionExists).toBe(0);
    });

    test("delete quiz", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz via API
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Quiz to Delete", description: "Will be deleted" },
        });
        const quiz = await quizRes.json();

        // Navigate to admin panel
        await page.goto(`${baseURL}/admin`);
        await page.waitForLoadState("networkidle");

        // Find and delete the quiz
        const quizCard = page.locator(`text="Quiz to Delete"`).locator("..");
        await expect(quizCard).toBeVisible({ timeout: 10000 });

        const deleteButton = quizCard.getByRole("button", { name: /delete/i });
        if (await deleteButton.count()) {
            await deleteButton.click();

            // Confirm deletion
            const confirmButton = page.getByRole("button", { name: /confirm|yes|delete/i });
            if (await confirmButton.count()) {
                await confirmButton.click();
            }

            // Verify quiz is gone
            await page.waitForTimeout(1000);
            const quizExists = await page.getByText("Quiz to Delete").count();
            expect(quizExists).toBe(0);
        }
    });

    test("navigate to theme editor", async ({ page }) => {
        const baseURL = process.env.BASE_URL || "http://localhost:3000";

        // Create quiz via API
        const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
            data: { title: "Theme Test Quiz" },
        });
        const quiz = await quizRes.json();

        // Navigate to quiz
        await page.goto(`${baseURL}/admin/quiz/${quiz.id}/questions`);
        await page.waitForLoadState("networkidle");

        // Click theme button
        const themeButton = page.getByRole("button", { name: /theme/i });
        await themeButton.click();

        // Verify theme page loaded
        await expect(
            page.getByText(/theme|customize|colors/i).first()
        ).toBeVisible({ timeout: 10000 });
    });
});
