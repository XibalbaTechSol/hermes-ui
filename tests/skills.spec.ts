import { test, expect } from '@playwright/test';

test.describe('Skills UX Audit', () => {
  test('should navigate to and load neural skills registry', async ({ page }) => {
    await page.goto('/');
    
    // Core UX: Navigation
    await page.getByTestId('nav-link-skills').click();
    const container = page.getByTestId('skills-view-container');
    await expect(container).toBeVisible();
    
    // Logic: Wait for scanning to finish
    const loader = page.getByTestId('loading-indicator');
    if (await loader.isVisible()) {
      await expect(loader).not.toBeVisible({ timeout: 20000 });
    }

    // Logic: Verify at least one skill item exists
    const skillList = page.locator('[data-testid^="skill-item-"]');
    await expect(skillList.first()).toBeVisible();

    // Visual: Capture for LLM analysis
    await page.screenshot({ path: 'test-results/pass-skills.png', fullPage: true });
    console.log('AUDIT_COMPLETE: skills');
  });
});
