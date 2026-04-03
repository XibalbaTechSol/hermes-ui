import { test, expect } from '@playwright/test';

test.describe('Hermes Chat UI - The Perfect Test', () => {
  
  test('should pass the comprehensive chat functional audit', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for the whole test

    // Log console errors
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // 1. INITIAL NAVIGATION
    await page.goto('/');
    const chatNavLink = page.locator('button').filter({ hasText: /CHAT/i });
    await expect(chatNavLink).toBeVisible();
    await chatNavLink.click();
    
    // Verify Chat Container is loaded
    await expect(page.getByTestId('chat-view-container')).toBeVisible();
    await page.screenshot({ path: 'test-results/audit-01-navigation.png' });

    // 2. DASHBOARD SUGGESTIONS AUDIT
    await expect(page.getByTestId('dashboard-suggestions')).toBeVisible();
    
    const apiBase = await page.evaluate(() => (window as any).API_BASE);
    console.log('Detected API_BASE:', apiBase);

    const suggestionBtn = page.getByTestId('suggestion-diagnostic');
    await expect(suggestionBtn).toBeVisible();
    await page.screenshot({ path: 'test-results/audit-02-dashboard.png' });

    // 3. SUGGESTION CLICK & SESSION INITIALIZATION
    await page.waitForTimeout(2000); // Wait for animations
    
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/chat/sessions') && res.request().method() === 'POST', { timeout: 60000 }),
      suggestionBtn.click({ force: true }),
    ]);
    
    // Wait for the container to reflect the active session
    const container = page.getByTestId('chat-view-container');
    await expect(container).toHaveAttribute('data-active-session', /.+/, { timeout: 30000 });
    
    // Should transition to chat area with active connection
    await expect(page.getByTestId('empty-state')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('connection-status')).toHaveText(/Neural Connection established/i);
    
    // Input should be populated and FOCUSED
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeFocused();
    const inputValue = await chatInput.inputValue();
    expect(inputValue).toContain('neural diagnostic');
    await page.screenshot({ path: 'test-results/audit-03-suggestion-init.png' });

    // 4. MESSAGE SENDING AUDIT
    await page.getByTestId('send-message-btn').click();
    
    // Check for user message in feed
    const firstMessage = page.locator('[data-role="user"]').first();
    await expect(firstMessage).toBeVisible();
    await expect(firstMessage.getByTestId('message-content')).toContainText(/neural diagnostic/i);
    
    // Check for sending indicator
    await expect(page.getByTestId('sending-indicator')).toBeVisible();
    await page.screenshot({ path: 'test-results/audit-04-sending.png' });

    // 5. BOT RESPONSE AUDIT
    // Wait for response to appear - using a longer timeout for LLM generation
    // We look for ANY message that is NOT from the user
    const botMessage = page.locator('div[data-role]').filter({ hasNot: page.locator('[data-role="user"]') }).first();
    await expect(botMessage).toBeVisible({ timeout: 240000 });
    
    // Wait for the indicator to disappear
    await expect(page.getByTestId('sending-indicator')).not.toBeVisible({ timeout: 120000 });
    
    // Verify bot content exists
    await expect(botMessage.getByTestId('message-content')).not.toBeEmpty({ timeout: 60000 });
    await page.screenshot({ path: 'test-results/audit-05-response.png' });

    // 6. SIDEBAR SESSION LIST AUDIT
    const sessionList = page.getByTestId('session-list');
    await expect(sessionList.locator('[data-active="true"]')).toBeVisible();
    
    // 7. NEW CONVERSATION (SIDEBAR) AUDIT
    await page.getByTestId('sidebar-new-convo-btn').click();
    
    // Should show empty state again
    await expect(page.getByTestId('empty-state')).toBeVisible({ timeout: 20000 });
    await expect(chatInput).toBeEmpty();
    await page.screenshot({ path: 'test-results/audit-06-new-convo.png' });

    // 8. DELETE SESSION AUDIT
    const activeSession = page.locator('[data-active="true"]').first();
    await activeSession.hover();
    const deleteBtn = activeSession.getByTestId('delete-session-btn');
    await expect(deleteBtn).toBeVisible();
    
    page.once('dialog', d => d.accept());
    await deleteBtn.click();
    
    // Should go back to dashboard suggestions
    await expect(page.getByTestId('dashboard-suggestions')).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/audit-07-final-deleted.png' });
  });
});
