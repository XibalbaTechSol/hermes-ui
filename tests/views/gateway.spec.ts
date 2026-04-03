import { test, expect } from '@playwright/test';

test.describe('GatewayView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    // Wait for the app to actually render (sidebar logo)
    await page.waitForSelector('[data-testid^="nav-link-"]', { timeout: 15000 });
    // Click on GATEWAY in the sidebar
    const btn = page.getByTestId('nav-link-gateway');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1500);
  });

  test('should view platforms and save gateway config', async ({ page }) => {
    // Wait for loading to complete - either the loading indicator disappears or the container appears
    await page.waitForFunction(() => {
      const loading = document.querySelector('[data-testid="loading-indicator"]');
      const container = document.querySelector('[data-testid="gateway-view-container"]');
      return container !== null || loading === null;
    }, { timeout: 15000 });
    
    await expect(page.getByTestId('gateway-view-container')).toBeVisible({ timeout: 5000 });

    // Check telegram tab (default)
    await expect(page.getByTestId('platform-tab-telegram')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/gateway-01-telegram.png`, fullPage: true });

    // Click whatsapp tab
    await page.getByTestId('platform-tab-whatsapp').click();
    await expect(page.getByText('WhatsApp Pairing')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${screenshotDir}/gateway-02-whatsapp.png`, fullPage: true });

    // Enable WhatsApp
    const enableToggle = page.getByTestId('platform-enable-toggle');
    // It's a checkbox masked as a toggle, checking toggle state by looking at the input
    await enableToggle.check({ force: true });
    
    // Check save btn
    const saveBtn = page.getByTestId('gateway-save-btn');
    
    // Override alert
    page.on('dialog', dialog => dialog.accept());
    
    await saveBtn.click();
    await expect(page.getByTestId('gateway-save-btn')).toHaveText('SAVE CONFIGURATION', { timeout: 5000 });

    await page.screenshot({ path: `${screenshotDir}/gateway-03-saved.png`, fullPage: true });
  });

});
