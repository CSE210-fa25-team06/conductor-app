import { test, expect } from '@playwright/test';

/*
This file contains a test suite of integration tests for the default dashboard screen.
Since the dashboard doesn't have much, all it can really check for is the welcome text and the current main text.
*/

//this beforeEach is used across testSuites to get all individual tests to start from the same point
test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard.html');
  
  await expect(page.locator('a#google-login')).toBeVisible();
  const loginButton = page.locator('a#google-login');
  await loginButton.click();
});

test('user name shows up on dashboard', async ({ page }) => {
  await expect(page.getByText('Welcome back, Professor Demo User')).toBeVisible();
});
