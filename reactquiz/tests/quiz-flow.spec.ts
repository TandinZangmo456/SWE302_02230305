import { test, expect } from "@playwright/test";

// TC001-TC005: Quiz Flow Tests
test.describe("Quiz Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC001: Start Quiz", async ({ page }) => {
    // Verify start screen is visible
    await expect(page.locator("text=Start Quiz")).toBeVisible();

    // Click Start Quiz button
    await page.click("text=Start Quiz");

    // Verify game transitions to playing state
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Verify timer starts at 30 seconds
    await expect(page.locator('[data-testid="timer"]')).toContainText("30");

    // Verify first question appears
    await expect(page.locator('[data-testid="question-text"]')).toBeVisible();
  });

  test("TC002: Answer Selection", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Click on first answer option
    const firstOption = page.locator('[data-testid="answer-option"]').first();
    await firstOption.click();

    // Verify answer is highlighted/selected
    await expect(firstOption).toHaveClass(/selected|bg-blue/);

    // Wait for auto-advance (1.5 seconds)
    await page.waitForTimeout(1600);

    // Verify we moved to next question or end state
    const questionCounter = page.locator('[data-testid="question-counter"]');
    await expect(questionCounter).toContainText(/2|Game Over/);
  });

  test("TC003: Correct Answer Scoring", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    const initialScore = await scoreElement.textContent();

    // Click the correct answer (based on questions.ts, first question correct answer is index 0)
    const correctOption = page.locator('[data-testid="answer-option"]').first();
    await correctOption.click();

    // Verify positive feedback is shown
    await expect(page.locator('[data-testid="feedback"]')).toContainText(
      /correct|right/i
    );

    // Wait for score update
    await page.waitForTimeout(500);

    // Verify score increased
    const newScore = await scoreElement.textContent();
    expect(newScore).not.toBe(initialScore);
  });

  test("TC004: Incorrect Answer Handling", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    const initialScore = await scoreElement.textContent();

    // Click an incorrect answer (any option other than first for first question)
    const incorrectOption = page
      .locator('[data-testid="answer-option"]')
      .nth(1);
    await incorrectOption.click();

    // Verify negative feedback is shown
    await expect(page.locator('[data-testid="feedback"]')).toContainText(
      /incorrect|wrong/i
    );

    // Verify correct answer is highlighted
    await expect(
      page.locator('[data-testid="answer-option"]').first()
    ).toHaveClass(/correct/);

    // Wait and verify score remains unchanged
    await page.waitForTimeout(500);
    const newScore = await scoreElement.textContent();
    expect(newScore).toBe(initialScore);
  });

  test("TC005: Complete Quiz", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer all questions (assuming 5 questions)
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid="answer-option"]');
      await page.click('[data-testid="answer-option"]:first-child');

      // Wait for transition
      await page.waitForTimeout(1600);
    }

    // Verify game transitions to end state
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible();

    // Verify final score is displayed
    await expect(page.locator('[data-testid="final-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="final-score"]')).toContainText(
      /score|points/i
    );
  });
});
