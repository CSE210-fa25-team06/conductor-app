import { test, expect } from '@playwright/test';

/*
This file contains a test suite of integration tests for the class directory screen.
It checks for existence of main elements sucha s the search bar and title. It checks functionality of searching as well.
*/

// Only professors can use the class directory feature so a professor account needs to be logged in
test.beforeAll(() => {
  process.env.MOCK_EMAIL = "ian@example.com";
});

// reset to original logged in user because dashboard test depends on it
test.afterAll(() => {
  process.env.MOCK_EMAIL = "alice@example.com";
});

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    const loginButton = page.locator('a#google-login');
    await loginButton.click();
    await page.getByTestId('directory-tab').click();

    /* 
    the reason this needs to be awaited is that the new html renders after a 250 ms delay.
    This creates issues with consistent testing across different browsers.
    A solution here is to await the class directory title so every test starts when the screen is loaded.
    If this were to hypothetically fail, it would not trigger an infinite loop. Playwright would stop it after 5 seconds.
    */
    await expect(page.getByText('Class Directory')).toBeVisible();
});


//same check as in the beforeEach but explicitly laid out here for clarity
test('Class Directory title appears', async ({ page }) => {
    await expect(page.getByText('Class Directory')).toBeVisible();
});

test('Search Bar Appears', async ({ page }) => {
    await expect(page.locator('.directory input')).toBeVisible();
});

test('Search bar properly retrieves names that match via the prefix', async ({ page }) => {
    const searchBar = page.getByPlaceholder('Search by first name');
    await searchBar.fill("al");
    await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Alex', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Charlie', exact: true })).not.toBeVisible();
});


