import { test, expect } from '@playwright/test';

test.describe('Gateway UX Deep Dive', () => {
  test('should allow switching platforms and toggling states', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-link-gateway').click();
    await expect(page.getByTestId('gateway-view-container')).toBeVisible();

    // 1. Initial State - Telegram should be active by default
    await expect(page.locator('h3:has-text("telegram")')).toBeVisible();
    await page.screenshot({ path: 'test-results/gateway-01-telegram.png' });

    // 2. Switch to Slack
    await page.getByTestId('platform-tab-slack').click();
    await expect(page.locator('h3:has-text("slack")')).toBeVisible();
    await page.screenshot({ path: 'test-results/gateway-02-slack.png' });

    // 3. Toggle Enable (Visual logic only in test for now)
    const toggle = page.getByTestId('platform-enable-toggle');
    const initialState = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !initialState });
    await page.screenshot({ path: 'test-results/gateway-03-toggle.png' });

    // 4. Verification
    console.log('AUDIT_COMPLETE: gateway-ux');
  });
});
