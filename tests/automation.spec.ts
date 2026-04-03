import { test, expect } from '@playwright/test';

test.describe('Automation UX Audit', () => {
  test('should navigate to and load node-based topology', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-automation').click();
    const container = page.getByTestId('graph-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Verify Flow engine
    const flow = page.locator('.react-flow__renderer');
    await expect(flow).toBeVisible();
    await expect(page.locator('.react-flow__node')).not.toHaveCount(0);

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-automation.png', fullPage: true });
    console.log('AUDIT_COMPLETE: automation');
  });
});
