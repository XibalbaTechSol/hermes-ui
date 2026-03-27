import { test, expect } from '@playwright/test';

test.describe('Hermes Automation Graph Audit', () => {
  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/audit';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(5000); 
    // Navigate to Graph (using the icon selector since it's common)
    const sidebar = page.locator('div.w-\\[72px\\]');
    await sidebar.locator('button').filter({ hasText: 'AUTOMATION' }).first().click();
    await page.waitForTimeout(3000);
  });

  test('Interactive Graph Audit', async ({ page }) => {
    console.log('Starting Interactive Graph Audit...');
    
    // 1. Initial Graph View
    await page.screenshot({ path: `${screenshotDir}/11-graph-initial.png`, fullPage: true });

    // 2. Click Memory Manager Loop
    console.log('Clicking Memory Manager...');
    await page.locator('text=Memory Manager').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/12-graph-memory-config.png`, fullPage: true });

    // 3. Click a Skill Node (if exists)
    const skillNode = page.locator('.react-flow__node-skill').first();
    if (await skillNode.isVisible()) {
        console.log('Clicking Skill Node...');
        await skillNode.click();
        await page.waitForTimeout(2000); // Wait for content fetch
        await page.screenshot({ path: `${screenshotDir}/13-graph-skill-editor.png`, fullPage: true });
    }

    // 4. Click a Subagent Node
    const agentNode = page.locator('.react-flow__node-subagent').first();
    if (await agentNode.isVisible()) {
        console.log('Clicking Subagent Node...');
        await agentNode.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/14-graph-agent-editor.png`, fullPage: true });
    }

    // 5. Click Learning Loop
    console.log('Clicking Learning Loop...');
    await page.locator('text=Learning Loop').first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${screenshotDir}/15-graph-learning-config.png`, fullPage: true });
  });
});
