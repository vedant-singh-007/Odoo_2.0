import { test, expect, Page } from "@playwright/test";

// Helper to login
async function login(page: Page, email = "manager@coreinventory.com", password = "manager123") {
  await page.goto("/login");
  await page.waitForSelector("#email", { timeout: 5000 });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("#login-button");
  await page.waitForURL("/", { timeout: 15000 });
}

test.describe("Authentication", () => {
  test("should show login page with demo credentials", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Welcome Back")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Demo Credentials")).toBeVisible();
    await expect(page.locator("text=manager@coreinventory.com")).toBeVisible();
  });

  test("should login with valid manager credentials", async ({ page }) => {
    await login(page);
    // Should see dashboard with sidebar
    await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Alice Manager")).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForSelector("#email", { timeout: 5000 });
    await page.fill("#email", "wrong@test.com");
    await page.fill("#password", "wrongpass");
    await page.click("#login-button");
    // Wait for the error to appear - NextAuth takes a moment
    await expect(page.locator("#login-error")).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    // Clear cookies first to ensure fresh state
    await page.context().clearCookies();
    await page.goto("/products");
    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 10000 });
  });

  test("should signup and auto-login", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForSelector("#name", { timeout: 5000 });
    await expect(page.locator("text=Create Account")).toBeVisible();
    await page.fill("#name", "Test User");
    await page.fill("#signup-email", `test${Date.now()}@test.com`);
    await page.fill("#signup-password", "testpass123");
    await page.click("#signup-button");
    await page.waitForURL("/", { timeout: 15000 });
    await expect(page.locator("text=Dashboard")).toBeVisible({ timeout: 10000 });
  });

  test("should logout successfully", async ({ page }) => {
    await login(page);
    await expect(page.locator("#logout-button")).toBeVisible({ timeout: 5000 });
    await page.click("#logout-button");
    await page.waitForURL(/login/, { timeout: 10000 });
    await expect(page.locator("text=Welcome Back")).toBeVisible({ timeout: 5000 });
  });
});
