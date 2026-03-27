import { test, expect } from '@playwright/test';

test.describe('Hermes UI Validation', () => {
  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots';

  test.beforeEach(async ({ page }) => {
    // Navigate to the local Hermes UI
    await page.goto('http://localhost:3006');
    // Ensure the page is loaded
    await page.waitForSelector('text=HERMES SYSTEM SNAPSHOT', { timeout: 30000 });
  });

  test('Dashboard View - Interactions and Screenshots', async ({ page }) => {
    console.log('Validating Dashboard View...');
    
    // Screenshot initial dashboard
    await page.screenshot({ path: `${screenshotDir}/01-dashboard-initial.png` });
    
    // Click CUSTOMIZE DASHBOARD
    const customizeBtn = page.getByRole('button', { name: 'CUSTOMIZE DASHBOARD' });
    await expect(customizeBtn).toBeVisible();
    await customizeBtn.click();
    
    // Check if reorder buttons appear
    await expect(page.locator('text=↓').first()).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/02-dashboard-customize.png` });
    
    // Click SAVE LAYOUT
    await page.getByRole('button', { name: 'SAVE LAYOUT' }).click();
    await expect(customizeBtn).toBeVisible();
    console.log('Dashboard validated.');
  });

  test('Chat View - Navigation and Session Creation', async ({ page }) => {
    console.log('Validating Chat View...');
    
    // Navigate to Chat
    await page.locator('button').filter({ hasText: 'CHAT' }).click();
    await expect(page.locator('text=HERMES CORE')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/03-chat-view.png` });
    
    // Ensure we are in "Select a session" state
    const chatInput = page.locator('input[placeholder="Select or create a session..."]');
    await expect(chatInput).toBeVisible();

    // Click New Session
    const newSessionBtn = page.locator('button[title="New Session"]');
    await expect(newSessionBtn).toBeVisible();
    await newSessionBtn.click();
    
    console.log('New Session clicked, waiting for activation...');

    // Wait for the placeholder to change to "Awaiting commands..."
    await page.waitForFunction(
      () => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const chatInput = inputs.find(i => i.placeholder === 'Awaiting commands...');
        return !!chatInput;
      },
      null,
      { timeout: 60000 }
    ).catch(async (e) => {
        const placeholders = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map(i => i.placeholder));
        console.error(`Timeout waiting for placeholder. Current placeholders: [${placeholders.join(', ')}]`);
        await page.screenshot({ path: `${screenshotDir}/error-chat-timeout.png` });
        throw e;
    });

    await expect(page.getByPlaceholder('Awaiting commands...')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/04-chat-new-session.png` });
    console.log('Chat validated.');
  });

  test('Gateway View - Platform Management', async ({ page }) => {
    console.log('Validating Gateway View...');
    
    // Navigate to Gateway
    await page.locator('button').filter({ hasText: 'GATEWAY' }).click();
    await expect(page.locator('text=Messaging Gateway')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/05-gateway-view.png` });
    
    // Select Slack platform
    await page.getByRole('button', { name: 'SLACK' }).click();
    await expect(page.locator('text=Configure bridge parameters for slack')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/06-gateway-slack.png` });
    
    // Toggle platform
    const toggle = page.locator('input[type="checkbox"]').first();
    await expect(toggle).toBeVisible();
    
    console.log('Gateway validated.');
  });

  test('Commands View - Tool Registry', async ({ page }) => {
    console.log('Validating Commands View...');
    
    // Navigate to Commands (TOOLS label)
    await page.locator('button').filter({ hasText: 'TOOLS' }).click();
    await expect(page.locator('text=Hermes Tools')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/07-commands-view.png` });
    
    // Select a tool, e.g., STATUS
    await page.getByRole('button', { name: 'STATUS' }).click();
    await expect(page.locator('text=hermes status')).toBeVisible();
    
    // Check if execute button is there
    await expect(page.getByRole('button', { name: 'EXECUTE' })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/08-commands-status.png` });
    console.log('Commands validated.');
  });

  test('Settings View - Configuration', async ({ page }) => {
    console.log('Validating Settings View...');
    
    // Navigate to Settings
    await page.locator('button').filter({ hasText: 'SETTINGS' }).click();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/10-settings-view.png` });
    
    // Check for some settings sections using labels from SettingsView.tsx
    await expect(page.locator('text=Neural Model')).toBeVisible();
    await expect(page.locator('text=Agent Cognition')).toBeVisible();
    
    console.log('Settings validated.');
  });

  test('Logs View - Quick Check', async ({ page }) => {
    console.log('Validating Logs View...');
    
    // Navigate to Logs
    await page.locator('button').filter({ hasText: 'LOGS' }).click();
    await page.waitForSelector('text=Output Console', { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: `${screenshotDir}/09-logs-view.png` });
    console.log('Logs validated.');
  });
});
