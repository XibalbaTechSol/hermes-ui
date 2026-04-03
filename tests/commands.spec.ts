import { test, expect } from '@playwright/test';

test.describe('Commands UX Audit', () => {
  test('should navigate to and accept system commands', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-commands').click();
    const container = page.getByTestId('commands-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Verify Input focus and interaction
    const input = page.getByTestId('command-input');
    await input.click();
    await input.fill('hermes doctor');
    await expect(input).toHaveValue('hermes doctor');

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-commands.png', fullPage: true });
    console.log('AUDIT_COMPLETE: commands');
  });
});
