import { test, expect } from '@playwright/test';

test.describe('DashboardView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    // Usually dashboard is the home or can be reached via 'DASHBOARD'
    const sidebar = page.locator('div.w-\\[72px\\]');
    const btn = sidebar.getByRole('button', { name: /DASHBOARD/i }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should display all modules correctly', async ({ page }) => {
    // Assert main container
    await expect(page.getByTestId('dashboard-view-container')).toBeVisible();

    // Assert grid, stats
    await expect(page.getByTestId('system-stats-grid')).toBeVisible();
    await expect(page.getByTestId('topology-preview')).toBeVisible();
    await expect(page.getByTestId('terminal-feed')).toBeVisible();

    // Initial screenshot
    await page.screenshot({ path: `${screenshotDir}/dashboard-01-initial.png`, fullPage: true });
    
    // Check CUSTOMIZE DASHBOARD toggle
    const customBtn = page.getByTestId('customize-dashboard-btn');
    await customBtn.click();
    await expect(customBtn).toHaveText('SAVE LAYOUT');
    
    // Screenshot customizing state
    await page.screenshot({ path: `${screenshotDir}/dashboard-02-customizing.png`, fullPage: true });

    // Save
    await customBtn.click();
    await expect(customBtn).toHaveText('CUSTOMIZE DASHBOARD');
    
    // Screenshot saved state
    await page.screenshot({ path: `${screenshotDir}/dashboard-03-saved.png`, fullPage: true });
  });

});
