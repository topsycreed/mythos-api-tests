import dotenv from 'dotenv';
import { defineConfig } from '@playwright/test';

// Конфиг Playwright исполняется как обычный модуль Node.js.
// Поэтому env нужно загрузить именно здесь, до старта раннера и до чтения process.env ниже.
dotenv.config({ override: true, quiet: true });

// Двойное отрицание превращает любое truthy/falsy значение в строгий boolean.
const isCI = !!process.env.CI;
// Этот флаг нужен, чтобы обычный прогон пропускал demo-тесты с тегом @ignore,
// а специальный runner мог включать их вручную.
const includeIgnoredTests = process.env.PW_INCLUDE_IGNORE === '1';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  // grepInvert работает как "анти-фильтр": все, что совпало с regex, будет исключено из запуска.
  grepInvert: includeIgnoredTests ? undefined : /@ignore/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI,
  /* Retry on CI only */
  retries: isCI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // Локально удобен list reporter с шагами, а в CI — github annotations плюс html report.
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list', { printSteps: true }], ['html', { open: 'never' }]],
  /* Store traces and other test artifacts in a stable folder for local runs and CI uploads. */
  outputDir: 'test-results',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // После этого request.get('mythology') автоматически резолвится относительно BASE_URL.
    baseURL: process.env.BASE_URL,

    /* Keep failure traces on CI and capture them on the first retry locally. */
    // Локально trace не нужен на каждый успешный тест, поэтому его собираем только на retry.
    trace: isCI ? 'retain-on-failure' : 'on-first-retry',
  },

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
