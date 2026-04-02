import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000, // 120 seconds per test
  use: {
    baseURL: 'http://localhost:3006',
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: '/usr/bin/google-chrome',
        }
      },
    },
  ],
});
