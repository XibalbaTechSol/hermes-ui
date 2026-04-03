import { test, expect } from '@playwright/test';

test.describe('MCPView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    const btn = page.getByTestId('nav-link-mcp');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should handle MCP server registration and edits', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('mcp-view-container')).toBeVisible();

    // Take screenshot of list
    await page.screenshot({ path: `${screenshotDir}/mcp-01-list.png`, fullPage: true });

    // Click register
    await page.getByRole('button', { name: '+ REGISTER SERVER' }).click();

    // Verify modal is open
    await expect(page.getByText('NEW PROTOCOL REGISTRATION')).toBeVisible();

    // Fill the inputs
    const nameInput = page.getByPlaceholder('e.g. github-mcp');
    await nameInput.fill('test-playwright-mcp');
    
    const cmdInput = page.getByPlaceholder('e.g. npx, node, uvx');
    await cmdInput.fill('echo');

    const argsInput = page.getByPlaceholder('-y, @org/server...');
    await argsInput.fill('\"hello mcp\"');

    // Screenshot modal
    await page.screenshot({ path: `${screenshotDir}/mcp-02-modal.png`, fullPage: true });

    // Save
    await page.getByRole('button', { name: 'INITIALIZE LINK' }).click();
    
    // Wait for the list to re-load
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    // Ensure it was added
    await expect(page.getByText('TEST-PLAYWRIGHT-MCP')).toBeVisible({ timeout: 10000 });

    // Screenshot added
    await page.screenshot({ path: `${screenshotDir}/mcp-03-added.png`, fullPage: true });

    // Try Ping Health if there is one
    const pings = page.getByRole('button', { name: /Ping Health/i });
    if (await pings.count() > 0) {
      await pings.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${screenshotDir}/mcp-04-ping.png`, fullPage: true });
    }
  });

});
