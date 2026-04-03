import { test, expect } from '@playwright/test';

test.describe('SettingsView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    const sidebar = page.locator('div.w-\\[72px\\]');
    const btn = sidebar.getByRole('button', { name: 'SETTINGS' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should jump between sections and edit configuration', async ({ page }) => {
    await expect(page.getByTestId('settings-view-container')).toBeVisible();

    // Initial snapshot
    await page.screenshot({ path: `${screenshotDir}/settings-01-initial.png`, fullPage: true });

    // Click on 'Visual Interface' in sidebar navigation
    await page.getByRole('button', { name: 'VISUAL INTERFACE' }).click();
    await page.waitForTimeout(500);
    // Screenshot
    await page.screenshot({ path: `${screenshotDir}/settings-02-visual.png`, fullPage: true });

    // Edit UI Skin to something else
    const uiSkinSelect = page.locator('select').filter({ hasText: 'Neural' }).first();
    if (await uiSkinSelect.isVisible()) {
      await uiSkinSelect.selectOption('ares');
      await page.waitForTimeout(1000);
      // Screenshot Ares theme
      await page.screenshot({ path: `${screenshotDir}/settings-03-theme-ares.png`, fullPage: true });
      // Change back
      await uiSkinSelect.selectOption('default');
    }

    // Go to System Directives and run a command (fake or true)
    await page.getByRole('button', { name: 'SYSTEM DIRECTIVES' }).click();
    await page.waitForTimeout(500);
    
    // Click 'System Doctor'
    await page.getByRole('button', { name: 'SYSTEM DOCTOR' }).click();
    
    // Check loading/pulse
    await expect(page.getByText('Initializing sequence...')).toBeVisible();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: `${screenshotDir}/settings-04-doctor.png`, fullPage: true });

    // Hit Sync Config
    const syncBtn = page.getByRole('button', { name: /Sync Config/i });
    page.on('dialog', dialog => dialog.accept());
    await syncBtn.click();
    
    await expect(syncBtn).toHaveText('Sync Config', { timeout: 10000 });
  });

});
