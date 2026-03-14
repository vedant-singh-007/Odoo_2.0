import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "manager@coreinventory.com");
  await page.fill("#password", "manager123");
  await page.click("#login-button");
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Products", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should display product list with seeded data", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("text=Product Catalog")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Steel Rods")).toBeVisible();
    await expect(page.locator("text=STL-001")).toBeVisible();
    await expect(page.locator("text=Hex Bolts")).toBeVisible();
  });

  test("should create a new product", async ({ page }) => {
    await page.goto("/products");
    await page.click("#create-product-button");
    await expect(page.locator("text=Create Product")).toBeVisible();

    const sku = `TST-${Date.now().toString().slice(-6)}`;
    await page.fill("#product-name", "Test Widgets");
    await page.fill("#product-sku", sku);
    await page.fill("#product-category", "Testing");
    await page.fill("#product-uom", "pcs");
    await page.click("#product-submit");

    // Product should appear in the list
    await expect(page.locator(`text=Test Widgets`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${sku}`)).toBeVisible();
  });

  test("should search products by name", async ({ page }) => {
    await page.goto("/products");
    await page.fill("#product-search", "Steel");
    await expect(page.locator("text=Steel Rods")).toBeVisible({ timeout: 3000 });
    // Other products should not be visible
    await expect(page.locator("text=Hex Bolts")).not.toBeVisible();
  });

  test("should view product detail with stock per location", async ({ page }) => {
    await page.goto("/products");
    await page.click("text=Steel Rods");
    await page.waitForURL(/\/products\//, { timeout: 5000 });
    await expect(page.locator("text=Product Details")).toBeVisible();
    await expect(page.locator("text=Stock by Location")).toBeVisible();
    await expect(page.locator("text=STL-001")).toBeVisible();
  });
});
