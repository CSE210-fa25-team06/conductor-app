import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard.html');
  const loginButton = page.locator('a#google-login');
  loginButton.click();
});

test('user name shows up on dashboard', async ({ page }) => {
  await expect(page.getByText('Welcome, Alice')).toBeVisible();
});

test('dashboard shows description', async ({ page }) => {
  await expect(page.getByText('Dashboard content will appear here...')).toBeVisible();
})
