import { test } from '@playwright/test';

test.describe('Hermes UI Extreme Visual Audit', () => {
  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/audit';

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(5000);
  });

  const capture = async (page, name, action) => {
    console.log(`--- Audit Action: ${name} ---`);
    try {
        // Ensure no modals are blocking
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        if (action) await action();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true });
    } catch (e) {
        console.error(`Audit Failure [${name}]:`, e.message);
        await page.screenshot({ path: `${screenshotDir}/error-${name}.png`, fullPage: true });
    }
  };

  test('Exercise Every Primary UI Feature', async ({ page }) => {
    const navTo = async (label) => {
        const sidebar = page.locator('div.w-\\[72px\\]');
        const btn = sidebar.locator('button').filter({ hasText: label }).first();
        await btn.click();
    };

    // 1. Dashboard
    await capture(page, '01-01-dashboard-initial', null);
    await capture(page, '01-02-dashboard-customize', () => page.getByRole('button', { name: 'CUSTOMIZE DASHBOARD' }).click());
    await capture(page, '01-03-dashboard-save', () => page.getByRole('button', { name: 'SAVE LAYOUT' }).click());

    // 2. Chat
    await capture(page, '02-01-chat-initial', () => navTo('CHAT'));
    await capture(page, '02-02-chat-new-session', () => page.locator('button[title="New Session"]').click());
    await capture(page, '02-03-chat-type', async () => {
        const input = page.locator('[placeholder="Awaiting commands..."]');
        if (await input.isVisible()) await input.fill('Neural Diagnostic Test');
    });

    // 3. Skills
    await capture(page, '03-01-skills-initial', () => navTo('SKILLS'));
    await capture(page, '03-02-skills-select', async () => {
        const first = page.locator('.cursor-pointer').first();
        if (await first.isVisible()) await first.click();
    });

    // 4. Subagents
    await capture(page, '04-01-subagents-initial', () => navTo('SUBAGENTS'));
    await capture(page, '04-02-subagents-edit', async () => {
        const first = page.locator('.cursor-pointer').first();
        if (await first.isVisible()) await first.click();
    });

    // 5. Commands
    await capture(page, '05-01-commands-initial', () => navTo('COMMANDS'));
    await capture(page, '05-02-commands-select', async () => {
        const btn = page.getByRole('button', { name: 'STATUS' });
        if (await btn.isVisible()) await btn.click();
    });

    // 6. Automation Graph
    await capture(page, '06-01-graph-initial', () => navTo('AUTOMATION'));
    await capture(page, '06-02-graph-node-click', async () => {
        const node = page.locator('.react-flow__node').first();
        if (await node.isVisible()) await node.click({ force: true });
    });

    // 7. Gateway
    await capture(page, '07-01-gateway-initial', () => navTo('GATEWAY'));
    await capture(page, '07-02-gateway-toggle', async () => {
        const toggle = page.locator('input[type="checkbox"]').first();
        if (await toggle.isVisible()) await toggle.click();
    });

    // 8. Settings
    await capture(page, '08-01-settings-initial', () => navTo('SETTINGS'));
    await capture(page, '08-02-settings-advanced', async () => {
        const btn = page.getByRole('button', { name: 'Advanced (YAML/MD)' });
        if (await btn.isVisible()) await btn.click();
    });

    // 9. MCP
    await capture(page, '09-01-mcp-initial', () => navTo('MCP'));
    await capture(page, '09-02-mcp-register', () => page.getByRole('button', { name: '+ REGISTER SERVER' }).click());

    // 10. Logs
    await capture(page, '10-01-logs-initial', () => navTo('LOGS'));
    await capture(page, '10-02-logs-filter', async () => {
        await page.locator('select').first().selectOption('error');
        await page.getByRole('button', { name: 'RELOAD' }).click();
    });
  });
});
