import { test, expect } from '@playwright/test';

test.describe('SubagentsView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    const btn = page.getByTestId('nav-link-subagents');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should load subagent grid and edit subagent content', async ({ page }) => {
    // Wait for load
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('subagents-view-container')).toBeVisible();

    await page.screenshot({ path: `${screenshotDir}/subagents-01-initial.png`, fullPage: true });

    // Look for an agent item
    const agentItems = page.locator('[data-testid^="agent-item-"]');
    if (await agentItems.count() > 0) {
      await agentItems.first().click();
      await page.waitForTimeout(1000);

      // Verify modal opened
      await expect(page.getByRole('button', { name: /UPDATE NEURAL CORE/i })).toBeVisible();

      await page.screenshot({ path: `${screenshotDir}/subagents-02-modal.png`, fullPage: true });

      // Edit a structured text area
      const textareas = page.locator('textarea');
      if (await textareas.count() > 0) {
        await textareas.first().fill('Updated structured section via Playwright\n');
      }

      // Switch to Raw Markdown
      await page.getByRole('button', { name: 'RAW_MARKDOWN' }).click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: `${screenshotDir}/subagents-03-raw.png`, fullPage: true });

      // Save
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: /UPDATE NEURAL CORE/i }).click();

      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/subagents-04-saved.png`, fullPage: true });
      
      // Go back
      await page.getByRole('button', { name: /Back/i }).click();
      await page.waitForTimeout(500);
    }
  });

});
