import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/api/auth/login');
  await page.goto('/dashboard.html');
});

test('user name shows up on dashboard', async ({ page }) => {
  await expect(page.getByText('Welcome, Alice')).toBeVisible();
});

test('dashboard shows description', async ({ page }) => {
  await expect(page.getByText('Dashboard content will appear here...')).toBeVisible();
})
