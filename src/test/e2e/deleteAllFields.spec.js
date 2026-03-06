import { test, expect } from "@playwright/test";

test.describe("Delete All Fields", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Dismiss DB selection modal if it appears
    const okBtn = page.getByRole("button", { name: /confirm/i });
    if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByText("Generic").click();
      await okBtn.click();
    }
  });

  test("page loads and canvas is visible", async ({ page }) => {
    await expect(page.locator("svg, canvas, [class*='canvas']").first()).toBeVisible({ timeout: 10000 });
  });

  test("stats box is present alongside the canvas", async ({ page }) => {
    await expect(page.getByText("Diagram Stats")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Tables")).toBeVisible();
    await expect(page.getByText("Relationships")).toBeVisible();
  });

  test("delete all fields button exists in table popover when table is present", async ({ page }) => {
    // If a table is on the canvas, hover it and open the "..." menu
    const tableEl = page.locator("foreignObject").first();
    if (await tableEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableEl.hover();
      // Click the "..." more button
      const moreBtn = tableEl.locator("button").filter({ hasText: "" }).last();
      await moreBtn.click({ force: true });
      await expect(page.getByText(/delete all fields/i)).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });
});
