import { test, expect } from '@playwright/test';

test.describe('Gateway UX Audit', () => {
  test('should navigate to and load messaging gateways', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-gateway').click();
    const container = page.getByTestId('gateway-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Verify Active Bridges section
    await expect(page.locator('text=ACTIVE BRIDGES')).toBeVisible();
    const bridgeCards = page.locator('div.bg-\\[\\#111111\\]').filter({ hasText: /Bridge/i });
    await expect(bridgeCards.first()).toBeVisible();

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-gateway.png', fullPage: true });
    console.log('AUDIT_COMPLETE: gateway');
  });
});
