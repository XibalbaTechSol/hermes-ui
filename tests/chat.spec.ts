import { test, expect } from '@playwright/test';

test.describe('Hermes Chat UI - Perfectionist Audit', () => {
  const screenshotPath = 'tests/screenshots/perfection/';

  test.beforeEach(async ({ page }) => {
    // 1. INITIAL NAVIGATION
    await page.goto('http://localhost:3006/');
    const chatNavLink = page.getByRole('button', { name: /CHAT/i });
    await expect(chatNavLink).toBeVisible();
    await chatNavLink.click();
    await expect(page.getByTestId('chat-view-container')).toBeVisible();
  });

  test('should pass the complete session lifecycle & visual audit', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    // 1. DASHBOARD SUGGESTIONS
    await expect(page.getByTestId('dashboard-suggestions')).toBeVisible();
    const suggestionBtn = page.getByTestId('suggestion-diagnostic');
    await expect(suggestionBtn).toBeVisible();

    // 2. SESSION INITIALIZATION
    await suggestionBtn.click({ force: true });
    const container = page.getByTestId('chat-view-container');
    await expect(container).toHaveAttribute('data-active-session', /.+/, { timeout: 30000 });
    await expect(page.getByTestId('empty-state')).toBeVisible({ timeout: 20000 });
    
    // 3. INPUT FOCUS & POPULATION
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeFocused();
    await expect(chatInput).not.toBeEmpty();
    await page.screenshot({ path: `${screenshotPath}02-chat-init.png`, fullPage: true });

    // 4. MESSAGE SENDING & STREAMING
    await page.getByTestId('send-message-btn').click();
    
    // Check for user message
    const userMsg = page.locator('[data-role="user"]').first();
    await expect(userMsg).toBeVisible();
    await expect(userMsg.getByTestId('message-content')).not.toBeEmpty();
    
    // Check for sending indicator
    await expect(page.getByTestId('sending-indicator')).toBeVisible();
    await page.screenshot({ path: `${screenshotPath}02-chat-sending.png`, fullPage: true });

    // 5. BOT RESPONSE (WAIT FOR COMPLETION)
    // Longer timeout for actual LLM generation if it's connected
    const botMsg = page.locator('div[data-role="assistant"]').first();
    await expect(botMsg).toBeVisible({ timeout: 240000 });
    await expect(page.getByTestId('sending-indicator')).not.toBeVisible({ timeout: 120000 });
    
    // Verify bot content and MARKDOWN rendering
    const content = botMsg.getByTestId('message-content');
    await expect(content).not.toBeEmpty();
    // We expect some markdown, maybe even code blocks if diagnostic
    await page.screenshot({ path: `${screenshotPath}02-chat-response.png`, fullPage: true });

    // 6. SIDEBAR & SEARCH AUDIT
    const sessionList = page.getByTestId('session-list');
    await expect(sessionList.locator('[data-active="true"]')).toBeVisible();
    
    const searchInput = page.locator('[placeholder="Search sessions..."]');
    await searchInput.fill('NoMatchingSessionSearchTerm');
    await expect(sessionList.locator('button')).toHaveCount(0);
    await searchInput.fill('');
    await expect(sessionList.locator('button')).not.toHaveCount(0);

    // 7. NEW SESSION (MANUAL)
    await page.getByTestId('sidebar-new-convo-btn').click();
    await expect(page.getByTestId('empty-state')).toBeVisible({ timeout: 10000 });
    await expect(chatInput).toBeEmpty();

    // 8. DELETE SESSION (CLEANUP)
    // Go back to the session we just had
    const firstSession = sessionList.locator('button').first();
    await firstSession.click();
    await expect(page.locator('[data-role="user"]')).not.toHaveCount(0);
    
    await firstSession.hover();
    const deleteBtn = firstSession.getByTestId('delete-session-btn');
    await expect(deleteBtn).toBeVisible();
    
    page.once('dialog', d => d.accept());
    await deleteBtn.click();
    
    // Should return to dashboard suggestions
    await expect(page.getByTestId('dashboard-suggestions')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${screenshotPath}02-chat-deleted.png`, fullPage: true });
  });
});
