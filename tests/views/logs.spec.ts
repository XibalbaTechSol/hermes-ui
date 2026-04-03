import { test, expect } from '@playwright/test';

test.describe('LogView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    const sidebar = page.locator('div.w-\\[72px\\]');
    const btn = sidebar.getByRole('button', { name: 'LOGS' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should filter and reload logs', async ({ page }) => {
    await expect(page.getByTestId('log-view-container')).toBeVisible();
    await page.waitForTimeout(1000); // Wait for fetch

    // Initial screenshot
    await page.screenshot({ path: `${screenshotDir}/logs-01-initial.png`, fullPage: true });

    // Filter by Level = ERROR
    const select = page.locator('select').first();
    await select.selectOption('error');
    
    // Search Content
    const searchInput = page.getByPlaceholder('Query...');
    await searchInput.fill('database');

    // Click RELOAD
    await page.getByRole('button', { name: 'RELOAD' }).click();
    await page.waitForTimeout(1000);

    // Screenshot after filter
    await page.screenshot({ path: `${screenshotDir}/logs-02-filtered.png`, fullPage: true });
  });

});
