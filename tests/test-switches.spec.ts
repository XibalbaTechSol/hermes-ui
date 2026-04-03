import { test, expect } from '@playwright/test';

test('Settings View Switches Work', async ({ page }) => {
  await page.goto('http://localhost:3006');
  
  // Navigate to SETTINGS
  await page.locator('button').filter({ hasText: 'SETTINGS' }).click();
  await page.waitForSelector('text=System Settings');
  
  // Find the first switch (Context Compression)
  const firstSwitchInput = page.locator('input[type="checkbox"]').first();
  const initialState = await firstSwitchInput.isChecked();
  
  // Click the switch (clicks the wrapper label)
  await firstSwitchInput.locator('..').click();
  
  // Verify state changed
  const newState = await firstSwitchInput.isChecked();
  expect(newState).not.toBe(initialState);
  
  console.log(`Switch changed from ${initialState} to ${newState}`);
});
