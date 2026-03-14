import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "manager@coreinventory.com");
  await page.fill("#password", "manager123");
  await page.click("#login-button");
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Operations", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should display receipts list with seeded data", async ({ page }) => {
    await page.goto("/operations/receipts");
    await expect(page.locator("text=Receipt Operations")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=REC-001")).toBeVisible();
  });

  test("should create and validate a new receipt", async ({ page }) => {
    await page.goto("/operations/receipts/new");
    await expect(page.locator("text=New Receipt")).toBeVisible();

    // Fill in reference
    await page.fill("#receipt-reference", "REC-TEST-001");

    // Select first product in the first line
    await page.click("#line-product-0");
    await page.waitForTimeout(500);
    // Click the first product item in the dropdown
    const firstItem = page.locator('[role="option"]').first();
    await firstItem.click();

    // Set quantity
    await page.fill("#line-qty-0", "25");

    // Click Save & Validate
    await page.click("#validate-receipt-button");

    // Should redirect to receipts list
    await page.waitForURL("/operations/receipts", { timeout: 10000 });
    await expect(page.locator("text=REC-TEST-001")).toBeVisible({ timeout: 5000 });
  });

  test("should display deliveries list", async ({ page }) => {
    await page.goto("/operations/deliveries");
    await expect(page.locator("text=Delivery Operations")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=DEL-001")).toBeVisible();
  });

  test("should show error when delivering with insufficient stock", async ({ page }) => {
    await page.goto("/operations/deliveries/new");
    await expect(page.locator("text=New Delivery")).toBeVisible();

    await page.fill("#delivery-reference", "DEL-FAIL");

    // Select a product
    await page.click("#line-product-0");
    await page.waitForTimeout(500);
    const firstItem = page.locator('[role="option"]').first();
    await firstItem.click();

    // Set an extremely high quantity that exceeds stock
    await page.fill("#line-qty-0", "999999");

    // Click Save & Validate
    await page.click("#validate-delivery-button");

    // Should show error about insufficient stock
    await expect(page.locator("#operation-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Insufficient stock")).toBeVisible();
  });

  test("should create an adjustment with auto-calculation", async ({ page }) => {
    await page.goto("/operations/adjustments");
    await expect(page.locator("text=Adjustments")).toBeVisible({ timeout: 5000 });

    // Click New Adjustment
    await page.click("#new-adjustment-button");
    await expect(page.locator("text=Physical Count Adjustment")).toBeVisible();

    // Select a product
    await page.click("#adj-product");
    await page.waitForTimeout(500);
    const firstProduct = page.locator('[role="option"]').first();
    await firstProduct.click();

    // Select a location
    await page.click("#adj-location");
    await page.waitForTimeout(500);
    const firstLocation = page.locator('[role="option"]').first();
    await firstLocation.click();

    // Enter counted quantity
    await page.fill("#adj-counted-qty", "50");
    await page.fill("#adj-reference", "ADJ-TEST-001");

    // Should show difference calculation
    await expect(page.locator("text=Difference")).toBeVisible();

    // Submit the adjustment
    await page.click("#submit-adjustment");

    // Should show in the adjustment history after processing
    await page.waitForTimeout(2000);
    await expect(page.locator("text=ADJ-TEST-001")).toBeVisible({ timeout: 5000 });
  });

  test("should validate a pending receipt from the list", async ({ page }) => {
    // REC-003 is DRAFT status from seed data
    await page.goto("/operations/receipts");
    await expect(page.locator("text=REC-003")).toBeVisible({ timeout: 5000 });

    // Find the validate button for the DRAFT receipt
    const draftRow = page.locator("tr", { has: page.locator("text=REC-003") });
    const validateBtn = draftRow.locator("button", { hasText: "Validate" });

    if (await validateBtn.isVisible()) {
      await validateBtn.click();
      await page.waitForTimeout(1000);
      // After validation, status should change to DONE
      await expect(draftRow.locator("text=DONE")).toBeVisible({ timeout: 5000 });
    }
  });
});
