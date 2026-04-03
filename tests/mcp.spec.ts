import { test, expect } from '@playwright/test';

test.describe('MCP UX Audit', () => {
  test('should navigate to and load MCP registry', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-mcp').click();
    const container = page.getByTestId('mcp-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Verify servers list
    const loading = page.locator('text=SCANNING_LINK_LAYER');
    if (await loading.isVisible()) {
      await expect(loader).not.toBeVisible({ timeout: 20000 });
    }
    const serverItems = page.locator('[data-testid^="mcp-server-item-"]');
    await expect(serverItems.first()).toBeVisible();

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-mcp.png', fullPage: true });
    console.log('AUDIT_COMPLETE: mcp');
  });
});
