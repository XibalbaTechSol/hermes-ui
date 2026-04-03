import { test, expect } from '@playwright/test';

test.describe('ChatView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    // Navigate to ChatView (assuming it corresponds to /chat or can be navigated to via sidebar)
    await page.goto('http://localhost:3006');
    await page.waitForTimeout(2000);
    // Click on CHAT in the sidebar if not already there
    const sidebar = page.locator('div.w-\\[72px\\]');
    const btn = sidebar.getByRole('button', { name: 'CHAT' }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000); // Wait for transition
    }
  });

  test('should render empty state and suggestions', async ({ page }) => {
    // Ensure we are in an empty state
    const suggestions = page.getByTestId('dashboard-suggestions');
    await expect(suggestions).toBeVisible({ timeout: 10000 });
    
    // Check suggestions
    await expect(page.getByTestId('suggestion-diagnostic')).toBeVisible();
    await expect(page.getByTestId('suggestion-sync')).toBeVisible();
    await expect(page.getByTestId('suggestion-protocol')).toBeVisible();
    
    // Screenshot: Empty state
    await page.screenshot({ path: `${screenshotDir}/chat-01-empty-state.png`, fullPage: true });
  });

  test('should create a new conversation via sidebar and interact', async ({ page }) => {
    // Click New Conversation in sidebar
    await page.getByTestId('sidebar-new-convo-btn').click();
    
    // Wait for the chat input to handle focus/state
    const input = page.getByTestId('chat-input');
    await expect(input).toBeEnabled({ timeout: 5000 });
    await expect(input).toHaveAttribute('placeholder', 'Awaiting commands...');

    // Take screenshot of empty new conversation
    await page.screenshot({ path: `${screenshotDir}/chat-02-new-convo.png`, fullPage: true });

    // Type and send a message
    await input.fill('Hello Hermes, this is a test from Playwright.');
    await page.getByTestId('send-message-btn').click();

    // Wait for message to appear
    await expect(page.getByTestId('chat-message-0')).toBeVisible({ timeout: 10000 });
    
    // Should have user message, then bot might be sending
    await page.waitForTimeout(2000); // wait for bot response rendering if mock
    
    // Take screenshot of conversation
    await page.screenshot({ path: `${screenshotDir}/chat-03-active-convo.png`, fullPage: true });
  });

  test('should filter sessions and delete a session', async ({ page }) => {
    // Search for a session
    const searchInput = page.getByTestId('session-search-input');
    await searchInput.fill('Hello Hermes');
    await page.waitForTimeout(500);

    // Delete session
    // Find the first session delete button
    const sessionItems = page.locator('[data-testid^="session-item-"]');
    if (await sessionItems.count() > 0) {
      const firstSession = sessionItems.first();
      // Hover to reveal delete btn
      await firstSession.hover();
      const deleteBtn = firstSession.getByTestId('delete-session-btn');
      
      // Override confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      await deleteBtn.click();
      await page.waitForTimeout(1000); // wait for deletion fetch
      // Screenshot post-deletion
      await page.screenshot({ path: `${screenshotDir}/chat-04-post-delete.png`, fullPage: true });
    }
  });
});
