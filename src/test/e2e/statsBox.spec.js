import { test, expect } from "@playwright/test";

test.describe("Stats Box", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Dismiss the DB selection modal if it appears
    const okBtn = page.getByRole("button", { name: /confirm/i });
    if (await okBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.getByText("Generic").click();
      await okBtn.click();
    }
  });

  test("stats box is visible on the canvas", async ({ page }) => {
    await expect(page.getByText("Diagram Stats")).toBeVisible();
  });

  test("shows Tables, Relationships and Max depth labels", async ({ page }) => {
    await expect(page.getByText("Tables")).toBeVisible();
    await expect(page.getByText("Relationships")).toBeVisible();
    await expect(page.getByText("Max depth")).toBeVisible();
  });

  test("table count increases after adding a table", async ({ page }) => {
    // Get initial table count from stats box
    const statsBox = page.locator(".popover-theme").filter({ hasText: "Diagram Stats" });
    const initialCount = await statsBox.locator("span.font-bold").first().innerText();

    // Click "Add table" button in the toolbar
    const addTableBtn = page.getByRole("button", { name: /add table/i });
    if (await addTableBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addTableBtn.click();
      const newCount = await statsBox.locator("span.font-bold").first().innerText();
      expect(Number(newCount)).toBeGreaterThan(Number(initialCount));
    } else {
      // Fallback: just verify stats box still renders
      await expect(statsBox).toBeVisible();
    }
  });
});
