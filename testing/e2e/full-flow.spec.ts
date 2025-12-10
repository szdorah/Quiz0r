import { test, expect, Page, BrowserContext } from "@playwright/test";

const PARTICIPANTS = parseInt(process.env.PARTICIPANT_COUNT || "10", 10);
const QUESTIONS = parseInt(process.env.QUESTION_COUNT || "5", 10);

test.describe("Full quiz flow (host + players)", () => {
  test.setTimeout(180000);

  async function joinPlayer(
    playerContext: BrowserContext,
    baseURL: string,
    gameCode: string,
    index: number
  ): Promise<Page> {
    const p = await playerContext.newPage();
    await p.goto(`${baseURL}/play/${gameCode}`);
    await p.waitForLoadState("networkidle");

    const nameInput = p.locator(
      'input[name="name"], input[placeholder*="name" i]'
    ).first();
    await nameInput.waitFor({ timeout: 10000 });
    await nameInput.fill(`UI Player ${index + 1}`);

    // Explicitly pick an emoji so avatar selection is exercised
    const emojiButtons = p.getByRole("button", { name: /😀|😎|🤖|👾|🦊|🐱|🐶/ });
    if (await emojiButtons.count()) {
      await emojiButtons.first().click();
    }

    await p.getByRole("button", { name: /join/i }).click();
    // Joining flips the component to a connecting screen before socket state arrives
    await expect(
      p.getByText(/connecting to game|waiting for host/i)
    ).toBeVisible({ timeout: 10000 });
    return p;
  }

  test("create quiz, host game, join players, answer questions", async ({ page, context, browser }) => {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    // Seed quiz via API
    const quizRes = await page.request.post(`${baseURL}/api/quizzes`, {
      data: { title: "E2E Stress Quiz", description: "Seeded by Playwright" },
    });
    expect(quizRes.ok()).toBeTruthy();
    const quiz = await quizRes.json();

    // Add questions (cap at 50 to avoid runaway test time)
    for (let i = 0; i < Math.min(QUESTIONS, 50); i++) {
      const questionRes = await page.request.post(
        `${baseURL}/api/quizzes/${quiz.id}/questions`,
        {
          data: {
            questionText: `Question ${i + 1}`,
            questionType: "SINGLE_SELECT",
            timeLimit: 30,
            points: 100,
            answers: [
              { answerText: "Answer A", isCorrect: true },
              { answerText: "Answer B", isCorrect: false },
              { answerText: "Answer C", isCorrect: false },
            ],
          },
        }
      );
      expect(questionRes.ok()).toBeTruthy();
    }

    // Create game session
    const gameRes = await page.request.post(`${baseURL}/api/games`, {
      data: { quizId: quiz.id },
    });
    expect(gameRes.ok()).toBeTruthy();
    const game = await gameRes.json();
    const gameCode: string = game.gameCode;
    expect(gameCode).toBeTruthy();

    // Open host control for this game
    const hostPage = page;
    await hostPage.goto(`${baseURL}/host/${gameCode}/control`);
    await hostPage.waitForLoadState("networkidle");
    const startButton = hostPage.getByRole("button", { name: /start game/i }).first();
    const startFallback = hostPage.locator('[data-testid="start-game"], button:has-text("Start Game")');
    await expect(
      hostPage.getByText(/waiting for players|player(s)? ready/i)
    ).toBeVisible({ timeout: 15000 });

    // Open host display in a separate window to simulate projector
    const displayPage = await context.newPage();
    await displayPage.goto(`${baseURL}/host/${gameCode}/display`);
    await displayPage.waitForLoadState("networkidle");
    test.info().attach?.("display-url", {
      body: displayPage.url(),
      contentType: "text/plain",
    });

    // Join players via the real UI (sockets) so the host sees ready players.
    // Use a dedicated context so all play tabs are grouped in one window when headed.
    const playerContext = await browser.newContext();
    const participantTotal = Math.min(PARTICIPANTS, 50);
    const playerPages: Page[] = [];
    for (let i = 0; i < participantTotal; i++) {
      const p = await joinPlayer(playerContext, baseURL, gameCode, i);
      playerPages.push(p);
    }

    // Wait for host to register players and enable Start
    await expect(startButton.or(startFallback)).toBeEnabled({ timeout: 30000 });
    if (await startButton.count()) {
      await startButton.click();
    } else {
      await startFallback.first().click();
    }

    // Advance through questions (host-only actions)
    const questionTotal = Math.min(QUESTIONS, 10);
    for (let q = 0; q < questionTotal; q++) {
      const nextBtn = hostPage.getByRole("button", { name: /next question|next/i }).first();
      await nextBtn.click();

      // Players answer
      for (const playerPage of playerPages) {
        const answers = playerPage.locator(
          '[data-testid="answer-option"], button:has-text("A"), button:has-text("B")'
        );
        if (await answers.count()) {
          await answers.first().click().catch(() => {});
        }
        const powerUp = playerPage.getByRole("button", { name: /power|hint|copy|double|zap|spark/i });
        if (await powerUp.count()) {
          await powerUp.first().click().catch(() => {});
        }
      }
      const reveal = hostPage.getByRole("button", { name: /reveal/i });
      if (await reveal.count()) {
        await reveal.click();
      }
    }

    // Final scoreboard appears
    const showResults = hostPage.getByRole("button", { name: /show results/i });
    if (await showResults.count()) {
      await showResults.click();
    }
    await expect(hostPage.getByText(/final/i)).toBeVisible({ timeout: 10000 });

    await playerContext.close();
  });
});
