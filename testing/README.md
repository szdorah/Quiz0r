# Quiz0r E2E Testing Suite

This directory contains the end-to-end (E2E) tests for Quiz0r, using [Playwright](https://playwright.dev/).

## 📂 Directory Structure

Everything related to E2E testing is contained within the `testing/` directory:

```text
testing/
├── e2e/                     # End-to-end tests (Playwright)
├── unit/                    # Unit tests (Vitest)
├── playwright.config.ts     # Playwright configuration
├── setup.ts                 # Global test setup
└── README.md                # This documentation
```

**Note:** Test artifacts (reports, screenshots, traces) are generated in the `.playwright/` folder **inside** this directory to keep the workspace clean.

---

## 🚀 Running Tests

You must specify the config file location when running manually.

### 1. The "Golden" Working Test (Recommended)
This is the most direct way to run the full game flow test that verifies player answers.

```bash
# Default (5 players, 3 questions)
npx playwright test testing/e2e/final-working.spec.ts --headed -c testing/playwright.config.ts

# Custom configuration
PARTICIPANT_COUNT=10 QUESTION_COUNT=5 npx playwright test testing/e2e/final-working.spec.ts -c testing/playwright.config.ts
```

### 2. Translation Testing
Tests the multi-language translation system with players selecting different languages.

```bash
# Run all translation tests (3 scenarios)
npx playwright test testing/e2e/translation.spec.ts --headed -c testing/playwright.config.ts

# Run specific translation test
npx playwright test testing/e2e/translation.spec.ts -g "players see content in their selected language" -c testing/playwright.config.ts
```

**Translation Test Scenarios:**
- **Mixed Languages**: 2 Spanish, 2 French, 1 English player
- **Language Switching**: Players switching languages mid-game
- **No Translations**: Verifies selector doesn't appear for English-only quizzes

### 3. Full Gameplay Simulation
Simulates realistic behavior with random answers, powerup usage (Hint, Copy, 2x), and certificate downloads.

```bash
npx playwright test testing/e2e/15-simulation.spec.ts -c testing/playwright.config.ts
```

### 4. Stress Test (Multi-Language, High Load)
Stress test with configurable player count, multiple languages, and random powerups.

```bash
# Basic stress test (20 players, 5 questions, headless)
PARTICIPANT_COUNT=20 QUESTION_COUNT=5 npx playwright test testing/e2e/stress-test.spec.ts -c testing/playwright.config.ts

# With all features enabled
PARTICIPANT_COUNT=20 QUESTION_COUNT=5 USE_POWERUPS=true USE_MULTI_LANG=true npx playwright test testing/e2e/stress-test.spec.ts -c testing/playwright.config.ts

# Extreme stress test (50 players)
PARTICIPANT_COUNT=50 QUESTION_COUNT=10 npx playwright test testing/e2e/stress-test.spec.ts -c testing/playwright.config.ts

# With video and screenshot capture
VIDEO=on SCREENSHOT=on PARTICIPANT_COUNT=20 QUESTION_COUNT=5 npx playwright test testing/e2e/stress-test.spec.ts -c testing/playwright.config.ts
```

### 5. Run with NPM Scripts (Easiest)
We have added a script to `package.json` that handles the config path for you:

```bash
npm run test:e2e
```

### 6. Run All Tests
Use the helper script to run the entire suite.
```bash
./testing/e2e/run-all-tests.sh
```

---

## ⚙️ Configuration

You can configure the tests using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PARTICIPANT_COUNT` | `5` | Number of players to simulate in the game |
| `QUESTION_COUNT` | `3` | Number of questions in the generated quiz |
| `HEADLESS` | `true` | Set to `false` to see the browser UI |
| `HEADED` | `false` | Set to `true` to see the browser UI (alternative to HEADLESS) |
| `BASE_URL` | `http://localhost:3000` | Target URL for the application |
| `USE_POWERUPS` | `true` | Enable random powerup usage in stress tests |
| `USE_MULTI_LANG` | `true` | Enable multiple languages in stress tests |
| `VIDEO` | `retain-on-failure` | Set to `on` to always record videos |
| `SCREENSHOT` | `only-on-failure` | Set to `on` to always capture screenshots |
| `TRACE` | `on-first-retry` | Set to `on` to always collect traces |

**Example:**
```bash
PARTICIPANT_COUNT=20 QUESTION_COUNT=10 HEADLESS=false npm run test:e2e
```

---

## 📊 Viewing Results

After running tests, results are stored in `testing/.playwright/`.

**To view the HTML report:**
```bash
npx playwright show-report testing/.playwright/report
```

All raw artifacts (screenshots, videos, traces) are stored in `testing/.playwright/results/`.
