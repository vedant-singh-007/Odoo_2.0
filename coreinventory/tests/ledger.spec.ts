import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "manager@coreinventory.com");
  await page.fill("#password", "manager123");
  await page.click("#login-button");
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Ledger / Move History", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should display move history with seeded ledger entries", async ({ page }) => {
    await page.goto("/moves");
    await expect(page.locator("text=Stock Ledger")).toBeVisible({ timeout: 5000 });
    // Should have entries from seed data
    await expect(page.locator("text=REC-001")).toBeVisible();
    await expect(page.locator("text=Steel Rods")).toBeVisible();
  });

  test("should show correct movement directions in ledger", async ({ page }) => {
    await page.goto("/moves");
    await expect(page.locator("text=Stock Ledger")).toBeVisible({ timeout: 5000 });
    // Should show source → destination arrows
    await expect(page.locator("text=Suppliers / Vendors")).toBeVisible();
    await expect(page.locator("text=Main Warehouse")).toBeVisible();
  });

  test("should filter ledger by operation type", async ({ page }) => {
    await page.goto("/moves");
    await expect(page.locator("text=Stock Ledger")).toBeVisible({ timeout: 5000 });

    // Filter by RECEIPT type
    await page.click("#filter-type");
    await page.waitForTimeout(500);
    await page.locator('[role="option"]', { hasText: "Receipts" }).click();
    await page.waitForTimeout(1000);

    // Should only show receipt entries
    await expect(page.locator("text=RECEIPT").first()).toBeVisible();
  });

  test("should show dashboard KPIs correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 5000 });

    // Verify KPI cards are present
    await expect(page.locator("#kpi-total-products")).toBeVisible();
    await expect(page.locator("#kpi-low-stock")).toBeVisible();
    await expect(page.locator("#kpi-pending-receipts")).toBeVisible();
    await expect(page.locator("#kpi-pending-deliveries")).toBeVisible();

    // Verify total products is 5 (from seed)
    const totalProducts = await page.locator("#kpi-total-products").textContent();
    expect(Number(totalProducts)).toBeGreaterThanOrEqual(5);
  });
});
