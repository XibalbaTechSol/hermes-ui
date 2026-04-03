import { test, expect } from '@playwright/test';

test.describe('CommandsView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    // Navigate to local app
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000); // Give it time to load

    // Click on COMMANDS in the sidebar if not already on it
    const btn = page.getByTestId('nav-link-commands');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1000);
  });

  test('should display empty state when no command is selected', async ({ page }) => {
    await expect(page.getByText('Select a directive to initialize')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/commands-01-empty.png`, fullPage: true });
  });

  test('should select a command, edit arguments, execute, and clear output', async ({ page }) => {
    // Wait for initial load
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('commands-view-container')).toBeVisible();

    // Select first command
    const commandsList = page.locator('button.w-full.text-left');
    await expect(commandsList.first()).toBeVisible({ timeout: 10000 });
    await commandsList.first().click();

    // Verify command details are loaded
    await expect(page.getByTestId('command-title')).toBeVisible();
    
    // Screenshot: Command Selected
    await page.screenshot({ path: `${screenshotDir}/commands-02-selected.png`, fullPage: true });

    // Edit Arguments
    const argsInput = page.getByTestId('command-input');
    await expect(argsInput).toBeVisible();
    await argsInput.fill('--help');
    await page.waitForTimeout(500);

    // Execute Command
    const executeBtn = page.getByRole('button', { name: /EXECUTE/i });
    
    // In order to catch the running state, we can quickly look at the button text
    await executeBtn.click();
    await expect(page.getByRole('button', { name: /Executing Directive/i })).toBeVisible();

    // Screenshot: Running State
    await page.screenshot({ path: `${screenshotDir}/commands-03-running.png`, fullPage: true });

    // Wait for execution to finish (button becomes back to EXECUTE)
    await expect(page.getByRole('button', { name: /^EXECUTE$/ })).toBeVisible({ timeout: 15000 });

    // Screenshot: Result
    await page.screenshot({ path: `${screenshotDir}/commands-04-result.png`, fullPage: true });

    // Clear Terminal
    const clearBtn = page.getByRole('button', { name: /Clear Terminal/i });
    await clearBtn.click();

    // Check if terminal is cleared
    await expect(page.getByText('Awaiting execution...')).toBeVisible();
    
    // Screenshot: Cleared
    await page.screenshot({ path: `${screenshotDir}/commands-05-cleared.png`, fullPage: true });
  });
});
