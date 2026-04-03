import { test, expect } from '@playwright/test';

test.describe('Hermes Dashboard - Perfectionist Audit', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. INITIAL NAVIGATION
    await page.goto('http://localhost:3006/');
    await expect(page.getByTestId('dashboard-view-container')).toBeVisible({ timeout: 10000 });
  });

  test('should pass a deep architectural telemetry audit', async ({ page }) => {
    // 1. HEADER AUDIT
    await expect(page.locator('h2')).toContainText('HERMES_CORE_DASHBOARD');
    await expect(page.locator('p').filter({ hasText: /Real-time Neural Telemetry/i })).toBeVisible();
    
    // 2. SYSTEM STATS AUDIT - Ensure no zero/placeholder data
    const memoryStat = page.getByTestId('stat-memory');
    await expect(memoryStat).toBeVisible();
    const memVal = await memoryStat.locator('.text-3xl').innerText();
    expect(parseFloat(memVal)).toBeGreaterThan(0);

    const cpuStat = page.getByTestId('stat-cpu');
    await expect(cpuStat).toBeVisible();
    const cpuVal = await cpuStat.locator('.text-3xl').innerText();
    expect(cpuVal).toContain('%');

    const uptimeStat = page.getByTestId('stat-uptime');
    await expect(uptimeStat).toBeVisible();
    await expect(uptimeStat.locator('.text-3xl')).not.toHaveText('0h');

    const tokenStat = page.getByTestId('stat-tokens');
    await expect(tokenStat).toBeVisible();
    await expect(tokenStat.locator('.text-3xl')).not.toHaveText('0');

    // 3. TOPOLOGY GRAPH AUDIT
    const topology = page.getByTestId('topology-preview');
    await expect(topology).toBeVisible();
    // ReactFlow nodes have class .react-flow__node
    await expect(topology.locator('.react-flow__node')).not.toHaveCount(0);

    // 4. TERMINAL FEED AUDIT
    const terminal = page.getByTestId('terminal-feed');
    await expect(terminal).toBeVisible();
    await expect(terminal.locator('div').filter({ hasText: /\[CORE\]/i }).first()).toBeVisible();

    // 5. ADDITIONAL WIDGETS AUDIT
    const gatewayWidget = page.locator('h3').filter({ hasText: /Gateway Active Bridges/i });
    await expect(gatewayWidget).toBeVisible();

    const skillsWidget = page.locator('h3').filter({ hasText: /Cognitive Skills Inventory/i });
    await expect(skillsWidget).toBeVisible();

    // 6. INTERACTION AUDIT - CUSTOMIZE TOGGLE
    const customizeBtn = page.getByTestId('customize-dashboard-btn');
    await expect(customizeBtn).toHaveText('CUSTOMIZE DASHBOARD');
    
    await customizeBtn.click();
    await expect(customizeBtn).toHaveText('SAVE LAYOUT');
    // Check if pulse indicator appears on stat cards
    await expect(page.locator('.animate-pulse').first()).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/perfection/01-dashboard-customizing.png', fullPage: true });

    await customizeBtn.click();
    await expect(customizeBtn).toHaveText('CUSTOMIZE DASHBOARD');

    // 7. SCROLL AUDIT
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="dashboard-view-container"]');
      if (container) container.scrollTo(0, container.scrollHeight);
    });
    await page.waitForTimeout(1000);

    // 8. FINAL SCREENSHOT FOR VISUAL AUDIT
    await page.screenshot({ path: 'tests/screenshots/perfection/01-dashboard-final.png', fullPage: true });
  });
});
