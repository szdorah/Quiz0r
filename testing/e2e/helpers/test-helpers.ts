import { Page, BrowserContext, expect } from "@playwright/test";
import { GameState, GameStatus } from "@/types";

/**
 * Test helper utilities for Quiz0r E2E tests
 */

export interface TestQuizConfig {
    title: string;
    description?: string;
    questionCount?: number;
    questionType?: "SINGLE_SELECT" | "MULTI_SELECT" | "MIXED";
    timeLimit?: number;
    points?: number;
}

export interface PlayerJoinConfig {
    gameCode: string;
    playerName: string;
    avatarType?: "emoji" | "custom";
    languageCode?: string;
}

/**
 * Creates a test quiz via API with configurable questions
 */
export async function createTestQuiz(
    page: Page,
    config: TestQuizConfig
): Promise<{ quizId: string; questionIds: string[] }> {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const {
        title,
        description = "Test quiz created by E2E tests",
        questionCount = 5,
        questionType = "SINGLE_SELECT",
        timeLimit = 30,
        points = 100,
    } = config;

    // Create quiz
    const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
        data: { title, description },
    });
    expect(quizRes.ok()).toBeTruthy();
    const quiz = await quizRes.json();

    // Add questions
    const questionIds: string[] = [];
    for (let i = 0; i < questionCount; i++) {
        const isSingleSelect =
            questionType === "SINGLE_SELECT" ||
            (questionType === "MIXED" && i % 2 === 0);

        const questionData = {
            questionText: `Test Question ${i + 1}`,
            questionType: isSingleSelect ? "SINGLE_SELECT" : "MULTI_SELECT",
            timeLimit,
            points,
            answers: [
                { answerText: "Answer A", isCorrect: true },
                { answerText: "Answer B", isCorrect: isSingleSelect ? false : true },
                { answerText: "Answer C", isCorrect: false },
                { answerText: "Answer D", isCorrect: false },
            ],
        };

        const questionRes = await page.request.post(
            `${baseURL}/api/quizzes/${quiz.id}/questions`,
            { data: questionData }
        );
        expect(questionRes.ok()).toBeTruthy();
        const question = await questionRes.json();
        questionIds.push(question.id);
    }

    return { quizId: quiz.id, questionIds };
}

/**
 * Creates a game session and returns the game code
 */
export async function createGameSession(
    page: Page,
    quizId: string
): Promise<string> {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const gameRes = await page.request.post(`${baseURL}/api/games`, {
        data: { quizId },
    });
    expect(gameRes.ok()).toBeTruthy();
    const game = await gameRes.json();

    expect(game.gameCode).toBeTruthy();
    expect(game.gameCode).toHaveLength(6);

    return game.gameCode;
}

/**
 * Helper to join a game as a player with avatar selection
 */
export async function joinAsPlayer(
    context: BrowserContext,
    config: PlayerJoinConfig
): Promise<Page> {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const { gameCode, playerName, avatarType = "emoji", languageCode } = config;

    const playerPage = await context.newPage();
    await playerPage.goto(`${baseURL}/play/${gameCode}`);
    await playerPage.waitForLoadState("networkidle");

    // Fill in player name
    const nameInput = playerPage
        .locator('input[name="name"], input[placeholder*="name" i]')
        .first();
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.fill(playerName);

    // Select avatar
    if (avatarType === "emoji") {
        const emojiButtons = playerPage.getByRole("button", {
            name: /😀|😎|🤖|👾|🦊|🐱|🐶|🎮|🎯|⚡/,
        });
        const count = await emojiButtons.count();
        if (count > 0) {
            await emojiButtons.first().click();
        }
    }

    // Select language if specified
    if (languageCode) {
        const languageSelector = playerPage.locator('select[name="language"]');
        if (await languageSelector.count()) {
            await languageSelector.selectOption(languageCode);
        }
    }

    // Join the game
    await playerPage.getByRole("button", { name: /join/i }).click();

    // Wait for join to complete
    await playerPage.waitForTimeout(2000);

    return playerPage;
}

/**
 * Waits for socket connection to be established
 */
export async function waitForSocketConnection(
    page: Page,
    timeout: number = 10000
): Promise<void> {
    // Wait for any socket-related content to appear
    await page.waitForFunction(
        () => {
            // Check if socket.io is loaded
            return (window as any).io !== undefined;
        },
        { timeout }
    );
}

/**
 * Waits for a specific game state
 */
export async function waitForGameState(
    page: Page,
    expectedStatus: GameStatus,
    timeout: number = 15000
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        // Check for visual indicators of the game state
        const hasWaitingIndicator = await page.getByText(/waiting for players/i).count();
        const hasActiveIndicator = await page.getByText(/get ready|question/i).count();
        const hasFinishedIndicator = await page.getByText(/final|game over/i).count();

        if (expectedStatus === "WAITING" && hasWaitingIndicator > 0) return;
        if (expectedStatus === "ACTIVE" && hasActiveIndicator > 0) return;
        if (expectedStatus === "FINISHED" && hasFinishedIndicator > 0) return;

        await page.waitForTimeout(500);
    }

    throw new Error(`Timeout waiting for game state: ${expectedStatus}`);
}

/**
 * Captures a screenshot with a descriptive name
 */
export async function captureScreenshot(
    page: Page,
    name: string
): Promise<void> {
    await page.screenshot({
        path: `test-results/screenshots/${name}-${Date.now()}.png`,
        fullPage: true,
    });
}

/**
 * Waits for a player to be admitted to the game
 */
export async function waitForAdmission(
    playerPage: Page,
    timeout: number = 15000
): Promise<void> {
    await expect(
        playerPage.getByText(/admitted|waiting for game to start/i)
    ).toBeVisible({ timeout });
}

/**
 * Submits an answer as a player
 * Based on the actual UI code, answer buttons are plain <button> elements
 * with a <span> containing the letter (A, B, C, D) as the first child
 */
export async function submitAnswer(
    playerPage: Page,
    answerIndex: number = 0
): Promise<void> {
    // Wait for the question to be displayed
    await playerPage.waitForTimeout(1000);

    // The answer buttons contain a span with the letter (A, B, C, D)
    // We'll target buttons that have these letters
    const letters = ['A', 'B', 'C', 'D'];
    const targetLetter = letters[answerIndex] || 'A';

    // Find all buttons on the page
    const allButtons = playerPage.locator('button');
    const buttonCount = await allButtons.count();

    // Look for a button that contains the target letter as its first span
    for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        const text = await button.textContent();

        // Check if this button starts with our target letter
        // The UI renders like "A Answer text here"
        if (text && text.trim().startsWith(targetLetter)) {
            await button.click();
            await playerPage.waitForTimeout(300);
            return;
        }
    }

    // Fallback: just click the nth button if we can't find by letter
    console.warn(`Could not find answer button with letter ${targetLetter}, using fallback`);
    if (buttonCount > answerIndex) {
        await allButtons.nth(answerIndex).click();
        await playerPage.waitForTimeout(300);
    }
}

/**
 * Waits for the host to see a specific number of players
 */
export async function waitForPlayerCount(
    hostPage: Page,
    expectedCount: number,
    timeout: number = 15000
): Promise<void> {
    await expect(
        hostPage.getByText(new RegExp(`${expectedCount}.*player`, "i"))
    ).toBeVisible({ timeout });
}

/**
 * Advances to the next question as host
 */
export async function hostNextQuestion(hostPage: Page): Promise<void> {
    const nextButton = hostPage.getByRole("button", {
        name: /next question|next/i,
    });
    await nextButton.click();
    await hostPage.waitForTimeout(1000); // Allow for transition
}

/**
 * Reveals answers as host
 */
export async function hostRevealAnswers(hostPage: Page): Promise<void> {
    const revealButton = hostPage.getByRole("button", { name: /reveal/i });
    if (await revealButton.count()) {
        await revealButton.click();
        await hostPage.waitForTimeout(500);
    }
}

/**
 * Starts the game as host
 */
export async function hostStartGame(hostPage: Page): Promise<void> {
    // Wait for start button to appear and be enabled
    const startButton = hostPage.getByRole("button", { name: /start game/i });

    // Wait for button to exist
    await expect(startButton).toBeVisible({ timeout: 30000 });

    // Wait for button to be enabled (requires players)
    await expect(startButton).toBeEnabled({ timeout: 30000 });

    // Click the button
    await startButton.click();

    // Wait for game to transition away from WAITING state
    await hostPage.waitForTimeout(3000);
}

/**
 * Cleans up test data by deleting a quiz
 */
export async function cleanupQuiz(
    page: Page,
    quizId: string
): Promise<void> {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    try {
        await page.request.delete(`${baseURL}/api/quizzes/${quizId}`);
    } catch (error) {
        console.warn(`Failed to cleanup quiz ${quizId}:`, error);
    }
}

/**
 * Gets the current score for a player from the scoreboard
 */
export async function getPlayerScore(
    page: Page,
    playerName: string
): Promise<number | null> {
    const scoreElement = page.locator(`text=${playerName}`).locator("..");
    if (await scoreElement.count()) {
        const text = await scoreElement.textContent();
        const match = text?.match(/(\d+)\s*points?/i);
        return match ? parseInt(match[1]) : null;
    }
    return null;
}
