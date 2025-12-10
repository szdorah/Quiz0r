#!/bin/bash

# Comprehensive E2E Test Execution Script
# This script runs all E2E tests and generates a coverage report

echo "=========================================="
echo "Quiz0r - Comprehensive E2E Test Suite"
echo "=========================================="
echo ""

# Check if server is running
if ! lsof -ti:3000 > /dev/null; then
    echo "❌ Error: Development server is not running on port 3000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✓ Server is running on port 3000"
echo ""

# Configuration
PLAYER_COUNT=${PARTICIPANT_COUNT:-5}
QUESTION_COUNT=${QUESTION_COUNT:-3}
HEADLESS=${HEADLESS:-true}

echo "Test Configuration:"
echo "  Players: $PLAYER_COUNT"
echo "  Questions: $QUESTION_COUNT"
echo "  Headless: $HEADLESS"
echo ""

echo "=========================================="
echo "Running Test Suites"
echo "=========================================="
echo ""

# Run all test suites
echo "📋 Test Suite 1: Quiz Management (Admin Panel)"
npx playwright test testing/e2e/01-quiz-management.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 2: Game Hosting Flow"
npx playwright test testing/e2e/02-game-hosting.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 3: Player Join Flow"
npx playwright test testing/e2e/03-player-join.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 4: Complete Gameplay Flow"
npx playwright test testing/e2e/04-gameplay-flow.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 5: Concurrent Players"
PARTICIPANT_COUNT=$PLAYER_COUNT npx playwright test testing/e2e/05-concurrent-players.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 6: Player Management"
npx playwright test testing/e2e/06-player-management.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 7: Error Handling"
npx playwright test testing/e2e/11-error-handling.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "📋 Test Suite 8: Host Controls"
npx playwright test testing/e2e/13-host-controls.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "=========================================="
echo "🎯 MASTER COMPREHENSIVE TEST"
echo "=========================================="
echo ""
PARTICIPANT_COUNT=$PLAYER_COUNT QUESTION_COUNT=$QUESTION_COUNT npx playwright test testing/e2e/00-master-comprehensive.spec.ts --reporter=list -c testing/playwright.config.ts

echo ""
echo "=========================================="
echo "Generating HTML Report"
echo "=========================================="
npx playwright show-report testing/.playwright/report --host 0.0.0.0

echo ""
echo "✅ All tests completed!"
echo "View the HTML report for detailed results"
