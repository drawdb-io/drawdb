const { test, expect } = require('@playwright/test');

test('auto arrange moves tables', async ({ page }) => {
  await page.goto('/editor');
  // create a few tables via UI or simulate state
  // for simplicity, assume there's a button to add table and relationships
  await page.click('button:has-text("Add table")');
  await page.click('button:has-text("Add table")');
  // give them IDs by grabbing coordinates before
  const coordsBefore = await page.$$eval('[data-testid="table"]', els => els.map(e => ({x: e.getAttribute('data-x'), y:e.getAttribute('data-y')})));
  await page.click('button[title="Auto arrange"]');
  const coordsAfter = await page.$$eval('[data-testid="table"]', els => els.map(e => ({x: e.getAttribute('data-x'), y:e.getAttribute('data-y')})));
  expect(coordsAfter).not.toEqual(coordsBefore);
});