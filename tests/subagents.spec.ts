import { test, expect } from '@playwright/test';

test.describe('Subagents UX Audit', () => {
  test('should navigate to and load agency hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-subagents').click();
    const container = page.getByTestId('subagents-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Wait for scanning
    const loader = page.getByTestId('loading-indicator');
    if (await loader.isVisible()) {
      await expect(loader).not.toBeVisible({ timeout: 20000 });
    }

    // Logic: Verify agent nodes load
    const agentList = page.locator('[data-testid^="agent-item-"]');
    await expect(agentList.first()).toBeVisible();

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-subagents.png', fullPage: true });
    console.log('AUDIT_COMPLETE: subagents');
  });
});
