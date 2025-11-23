import { test, expect } from "@playwright/test";

// TC008-TC009: Game State Tests
test.describe("Game State Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC008: Restart Quiz", async ({ page }) => {
    // Complete a quiz first
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Answer all questions quickly
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('[data-testid="answer-option"]');
      await page.click('[data-testid="answer-option"]:first-child');
      await page.waitForTimeout(1600);
    }

    // Verify we're at game over screen
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible();

    // Click restart/play again button
    const restartButton = page
      .locator("text=Play Again")
      .or(page.locator("text=Restart"))
      .or(page.locator('[data-testid="restart-button"]'));
    await restartButton.click();

    // Verify quiz resets to start state
    await expect(page.locator("text=Start Quiz")).toBeVisible();

    // Start again and verify score is reset to 0
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="score"]');

    const scoreText = await page.locator('[data-testid="score"]').textContent();
    expect(scoreText).toContain("0");

    // Verify question index is reset to 1 (first question)
    const questionCounter = page.locator('[data-testid="question-counter"]');
    await expect(questionCounter).toContainText("1");
  });

  test("TC009: Question Navigation", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Verify we start at question 1
    await expect(
      page.locator('[data-testid="question-counter"]')
    ).toContainText("1");

    // Answer first question
    await page.click('[data-testid="answer-option"]:first-child');
    await page.waitForTimeout(1600);

    // Verify we advance to question 2
    await expect(
      page.locator('[data-testid="question-counter"]')
    ).toContainText("2");

    // Get the question text to verify it changed
    const secondQuestionText = await page
      .locator('[data-testid="question-text"]')
      .textContent();

    // Answer second question
    await page.click('[data-testid="answer-option"]:first-child');
    await page.waitForTimeout(1600);

    // Verify we advance to question 3
    await expect(
      page.locator('[data-testid="question-counter"]')
    ).toContainText("3");

    // Verify question text changed
    const thirdQuestionText = await page
      .locator('[data-testid="question-text"]')
      .textContent();
    expect(thirdQuestionText).not.toBe(secondQuestionText);

    // Continue through all questions to verify navigation works
    for (let i = 3; i <= 5; i++) {
      await page.click('[data-testid="answer-option"]:first-child');
      await page.waitForTimeout(1600);

      if (i < 5) {
        await expect(
          page.locator('[data-testid="question-counter"]')
        ).toContainText((i + 1).toString());
      }
    }

    // Verify we reach the end
    await expect(page.locator('[data-testid="game-over"]')).toBeVisible();
  });
});
