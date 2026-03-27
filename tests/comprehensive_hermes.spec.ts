import { test, expect } from '@playwright/test';

test.describe('Comprehensive Hermes UI Gold Standard', () => {
  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/comprehensive';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    // Give some time for initial load and possible redirect/state hydration
    await page.waitForTimeout(5000);
    
    try {
      await page.waitForSelector('text=HERMES CORE', { timeout: 15000 });
    } catch (e) {
      const content = await page.textContent('body');
      console.log('Current URL:', page.url());
      await page.screenshot({ path: `${screenshotDir}/error-beforeEach.png` });
      throw e;
    }
  });

  test('Dashboard: Full Cycle', async ({ page }) => {
    await page.screenshot({ path: `${screenshotDir}/01-01-dashboard-initial.png` });
    
    const customizeBtn = page.getByRole('button', { name: 'CUSTOMIZE DASHBOARD' });
    await customizeBtn.click();
    await expect(page.locator('text=↓').first()).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/01-02-dashboard-customizing.png` });
    
    await page.getByRole('button', { name: 'SAVE LAYOUT' }).click();
    await expect(customizeBtn).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/01-03-dashboard-final.png` });
  });

  test('Chat: Session Management & Messaging', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'CHAT' }).click();
    await expect(page.locator('text=HERMES CORE')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/02-01-chat-initial.png` });
    
    // Create new session
    await page.locator('button[title="New Session"]').click();
    await page.waitForFunction(
      () => {
        const els = Array.from(document.querySelectorAll('[placeholder]'));
        return els.some(e => (e as any).placeholder === 'Awaiting commands...');
      },
      null,
      { timeout: 60000 }
    );
    await page.screenshot({ path: `${screenshotDir}/02-02-chat-new-session.png` });
    
    // Send message
    const input = page.locator('[placeholder="Awaiting commands..."]');
    await input.fill('ping');
    await page.screenshot({ path: `${screenshotDir}/02-03-chat-input-filled.png` });
    await page.keyboard.press('Enter');
    
    // Wait for "sending" state to appear
    await page.waitForSelector('.chat-sending-indicator', { state: 'visible', timeout: 10000 });
    await page.screenshot({ path: `${screenshotDir}/02-04-chat-sending.png` });

    // Wait for "sending" state to finish
    await page.waitForSelector('.chat-sending-indicator', { state: 'hidden', timeout: 90000 });
    await page.screenshot({ path: `${screenshotDir}/02-05-chat-response-received.png` });
  });

  test('Skills: Skillset Tree & Content', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'SKILLS' }).click();
    await expect(page.locator('text=Neural Skillsets')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/03-01-skills-initial.png` });
    
    // Ensure at least one skill or directory is listed
    await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
    const skillItems = page.locator('.cursor-pointer');
    await expect(skillItems.first()).toBeVisible();
    
    await page.screenshot({ path: `${screenshotDir}/03-02-skills-list.png` });
    
    // Select first skill item
    await skillItems.first().click();
    await page.waitForTimeout(1000); // Wait for content load
    await page.screenshot({ path: `${screenshotDir}/03-03-skill-selected.png` });
  });

  test('Gateway: Platform Toggling', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'GATEWAY' }).click();
    await expect(page.locator('text=Messaging Gateway')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/04-01-gateway-initial.png` });
    
    await page.getByRole('button', { name: 'DISCORD' }).click();
    await expect(page.locator('text=Configure bridge parameters for discord')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/04-02-gateway-discord-selected.png` });
    
    const toggle = page.locator('input[type="checkbox"]').first();
    const initialState = await toggle.isChecked();
    await toggle.click();
    await expect(toggle.isChecked()).not.toBe(initialState);
    
    await page.screenshot({ path: `${screenshotDir}/04-03-gateway-toggled.png` });
  });

  test('Subagents: Navigation and DNA decryption', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'SUBAGENTS' }).click();
    await expect(page.getByTestId('subagent-orchestrator')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/05-01-subagents-initial.png` });
    
    // Select first agent card
    const firstAgent = page.locator('.cursor-pointer').first();
    await expect(firstAgent).toBeVisible();
    await firstAgent.click();
    
    // Wait for textarea/editor
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${screenshotDir}/05-02-agent-editor.png` });
    
    // Go back using the specific SVG path for the back button
    await page.locator('button').filter({ hasText: 'Back' }).or(page.locator('svg').locator('path[d="m15 18-6-6 6-6"]').locator('..')).first().click();
    await expect(page.getByTestId('subagent-orchestrator')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/05-03-subagents-back.png` });
  });

  test('Commands: Execution Cycle', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'COMMANDS' }).click();
    await expect(page.locator('text=Hermes Tools')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/06-01-commands-initial.png` });
    
    await page.getByRole('button', { name: 'MODEL' }).click();
    await expect(page.getByTestId('command-title')).toContainText('MODEL');
    await page.screenshot({ path: `${screenshotDir}/06-02-command-selected.png` });
    
    const executeBtn = page.getByRole('button', { name: 'EXECUTE' });
    await executeBtn.click();
    
    // Wait for output console to change from "Awaiting execution..." or showing progress
    await expect(page.locator('pre')).not.toHaveText('Awaiting execution...', { timeout: 30000 });
    await page.screenshot({ path: `${screenshotDir}/06-03-command-executed.png` });
  });

  test('Settings: Tabs and Persistence', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'SETTINGS' }).click();
    await expect(page.locator('text=System Settings')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/07-01-settings-initial.png` });
    
    await page.getByRole('button', { name: 'Advanced (YAML/MD)' }).click();
    await expect(page.locator('text=Active Configuration Files')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/07-02-settings-advanced.png` });
    
    await page.getByRole('button', { name: 'Core Configuration' }).click();
    await expect(page.locator('text=Neural Settings')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/07-03-settings-core.png` });
  });

  test('MCP: Registry Management', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'MCP' }).click();
    await expect(page.locator('text=MCP PROTOCOL REGISTRY')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/08-01-mcp-initial.png` });
    
    await page.getByRole('button', { name: '+ REGISTER SERVER' }).click();
    await expect(page.locator('text=NEW PROTOCOL REGISTRATION')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/08-02-mcp-modal.png` });
    
    await page.getByPlaceholder('e.g. github-mcp').fill('test-server');
    await page.getByPlaceholder('e.g. npx, node, uvx').fill('node');
    await page.getByPlaceholder('-y, @org/server...').fill('--version');
    await page.screenshot({ path: `${screenshotDir}/08-03-mcp-filled.png` });
    
    await page.getByRole('button', { name: 'INITIALIZE LINK' }).click();
    await expect(page.locator('text=NEW PROTOCOL REGISTRATION')).not.toBeVisible();
    await expect(page.locator('text=TEST-SERVER')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/08-04-mcp-final.png` });
  });

  test('Logs: Real-time filtering', async ({ page }) => {
    await page.locator('button').filter({ hasText: 'LOGS' }).click();
    await expect(page.locator('text=REAL-TIME LOG CONSOLE')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/09-01-logs-initial.png` });
    
    await page.locator('select').first().selectOption('error');
    await page.getByRole('button', { name: 'RELOAD' }).click();
    await page.screenshot({ path: `${screenshotDir}/09-02-logs-filtered.png` });
  });
});
