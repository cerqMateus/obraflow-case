import { defineConfig, devices } from '@playwright/test';

if (process.env.COMPOSE_PROJECT_NAME !== 'obraflow-test' || process.env.E2E_BASE_URL !== 'http://frontend') {
  throw new Error('E2E requires the isolated obraflow-test Compose project and http://frontend.');
}
export default defineConfig({
  testDir: './tests', workers: 1, retries: 0, reporter: 'list',
  use: { baseURL: 'http://frontend', trace: 'off', screenshot: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
  ],
});
