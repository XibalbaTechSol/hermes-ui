import { test, expect } from '@playwright/test';

test.describe('GraphView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    const btn = page.getByTestId('nav-link-automation');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should render graph and interact with a node', async ({ page }) => {
    // Wait for loading to finish
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('graph-view-container')).toBeVisible();

    // Base screenshot
    await page.screenshot({ path: `${screenshotDir}/graph-01-initial.png`, fullPage: true });

    // Try to click an existing node in the ReactFlow canvas
    // XYFlow nodes have class .react-flow__node
    const nodes = page.locator('.react-flow__node');
    if (await nodes.count() > 0) {
      await nodes.first().click({ force: true });
      await page.waitForTimeout(1000);
      
      // Panel should open showing node details
      await expect(page.getByRole('button', { name: '×' })).toBeVisible();

      await page.screenshot({ path: `${screenshotDir}/graph-02-node-selected.png`, fullPage: true });

      // Close the panel
      await page.getByRole('button', { name: '×' }).click();
      await page.waitForTimeout(500);
    }
    
    // Try to trigger "Re-Index Layers"
    await page.getByRole('button', { name: /Re-Index Layers/i }).click();
    await page.waitForTimeout(1000);
    
    // Screenshot
    await page.screenshot({ path: `${screenshotDir}/graph-03-reindexed.png`, fullPage: true });
  });

});
