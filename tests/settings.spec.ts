import { test, expect } from '@playwright/test';

test.describe('Settings UX Audit', () => {
  test('should navigate to and load system configuration', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-settings').click();
    const container = page.getByTestId('settings-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Verify tabs and parameters
    await expect(page.locator('text=Inference Parameters')).toBeVisible();
    await expect(page.locator('text=Environment Variables')).toBeVisible();

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-settings.png', fullPage: true });
    console.log('AUDIT_COMPLETE: settings');
  });
});
