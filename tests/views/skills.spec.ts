import { test, expect } from '@playwright/test';

test.describe('SkillsView Tailored Tests', () => {

  const screenshotDir = '/home/xibalba/hermes-ui/tests/screenshots/views';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3006');
    await page.waitForSelector('[data-testid^="nav-link-"]', { timeout: 15000 });
    const btn = page.getByTestId('nav-link-skills');
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1500);
  });

  test('should load skills tree and edit skill content', async ({ page }) => {
    // Wait for view container
    await expect(page.getByTestId('skills-view-container')).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: `${screenshotDir}/skills-01-initial.png`, fullPage: true });

    // Look for a skill item in the sidebar
    // We assume there are some items, they have data-testid starting with "skill-item-"
    const skillItems = page.locator('[data-testid^="skill-item-"]');
    
    if (await skillItems.count() > 0) {
      // Find the first document skill (has 📄) or just click the first one
      const docItem = skillItems.filter({ hasText: '📄' }).first();
      
      if (await docItem.isVisible({ timeout: 5000 })) {
        await docItem.click();
        await page.waitForTimeout(1000);

        // Expect textarea to show up
        const textarea = page.locator('textarea');
        await expect(textarea).toBeVisible();

        await page.screenshot({ path: `${screenshotDir}/skills-02-selected.png`, fullPage: true });

        // Edit
        await textarea.fill('# Modified Skill via Playwright\n');
        
        // Save
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: /UPDATE NEURAL SKILL/i }).click();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${screenshotDir}/skills-03-saved.png`, fullPage: true });
      }
    }
  });

});
