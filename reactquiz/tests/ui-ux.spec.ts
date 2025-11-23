import { test, expect } from "@playwright/test";

// TC010-TC011: UI/UX Tests
test.describe("UI/UX Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("TC010: Responsive Design", async ({ page }) => {
    // Test desktop size (default)
    const container = page.locator(".max-w-md.mx-auto, .md\\:max-w-2xl");
    await expect(container).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");

    // Verify start button is still visible and clickable
    await expect(page.locator("text=Start Quiz")).toBeVisible();
    await page.click("text=Start Quiz");

    // Verify question card adapts to mobile
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();

    // Verify answer options are accessible on mobile
    const answerOptions = page.locator('[data-testid="answer-option"]');
    await expect(answerOptions.first()).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState("networkidle");

    // Verify layout still works
    await expect(page.locator('[data-testid="question-card"]')).toBeVisible();
    await expect(answerOptions.first()).toBeVisible();

    // Test large desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");

    // Verify content doesn't become too wide (max-width constraint)
    const cardWidth = await page
      .locator(".max-w-md.mx-auto, .md\\:max-w-2xl")
      .boundingBox();
    expect(cardWidth?.width).toBeLessThan(800); // Should be constrained by max-width
  });

  test("TC011: Visual Feedback", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="question-card"]');

    // Test answer selection visual feedback
    const firstOption = page.locator('[data-testid="answer-option"]').first();

    // Initially no option should be selected
    await expect(firstOption).not.toHaveClass(/selected|bg-blue/);

    // Click first option and verify visual feedback
    await firstOption.click();

    // Should show selection state
    await expect(firstOption).toHaveClass(/selected|bg-blue|bg-green/);

    // Wait for feedback message
    const feedback = page.locator('[data-testid="feedback"]');
    await expect(feedback).toBeVisible();

    // Verify feedback has appropriate styling (correct/incorrect)
    const feedbackText = await feedback.textContent();
    if (feedbackText?.toLowerCase().includes("correct")) {
      await expect(feedback).toHaveClass(/green|success/);
    } else {
      await expect(feedback).toHaveClass(/red|error/);
    }

    // Wait for auto-advance and test next question
    await page.waitForTimeout(1600);

    // On new question, no option should be selected initially
    const newFirstOption = page
      .locator('[data-testid="answer-option"]')
      .first();
    await expect(newFirstOption).not.toHaveClass(/selected|bg-blue/);

    // Test hover effects (if implemented)
    await newFirstOption.hover();
    // Note: Hover effects would need specific implementation to test
  });

  test("TC011b: Timer Visual Feedback", async ({ page }) => {
    // Start the quiz
    await page.click("text=Start Quiz");
    await page.waitForSelector('[data-testid="timer"]');

    // Verify timer is visible
    await expect(page.locator('[data-testid="timer"]')).toBeVisible();

    // Wait for timer to get low and check for visual warning
    await page.waitForFunction(
      () => {
        const timer = document.querySelector('[data-testid="timer"]');
        if (!timer) return false;
        const time = parseInt(timer.textContent?.match(/\d+/)?.[0] || "30");
        return time <= 10;
      },
      { timeout: 25000 }
    );

    // Timer should show warning state when low (red color, etc.)
    const timer = page.locator('[data-testid="timer"]');
    await expect(timer).toHaveClass(/red|warning|danger/);
  });
});
