import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Add retries for flaky tests (especially in CI)
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Add navigation timeout
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    // Reuse server in dev, fresh server in CI
    reuseExistingServer: !process.env.CI,
    // Increased timeout for slow machines
    timeout: 180000,
    stdout: 'pipe',
    stderr: 'pipe',
    ignoreHTTPSErrors: true,
    // Add retries for server startup
    reuseExistingServer: process.env.CI ? false : true,
  },
  // Global timeout for tests
  timeout: 45000,
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },
})
