const { test, expect } = require('@playwright/test');

// This test verifies that clicking the sample data button triggers download
// Playwright has a download object we can check.

test('generate sample data triggers download', async ({ page }) => {
  await page.goto('/editor');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button[title="Generate sample data"]'),
  ]);
  const path = await download.path();
  expect(path).toBeTruthy();
  const text = await download.text();
  const json = JSON.parse(text);
  // there should be at least one table with array of rows
  const keys = Object.keys(json);
  expect(keys.length).toBeGreaterThan(0);
  expect(Array.isArray(json[keys[0]])).toBe(true);
});