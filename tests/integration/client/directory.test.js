import { test, expect } from '@playwright/test';

/*
This file contains a test suite of integration tests for the class directory screen.
It checks for existence of main elements sucha s the search bar and title. It checks functionality of searching as well.
*/

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    await expect(page.locator('a#google-login')).toBeVisible();
    const loginButton = page.locator('a#google-login');
    await loginButton.click();
    await page.getByTestId('directory-tab').click();

    /* 
    the reason this needs to be awaited is that the new html renders after a 250 ms delay.
    This creates issues with consistent testing across different browsers.
    A solution here is to await the class directory title so every test starts when the screen is loaded.
    If this were to hypothetically fail, it would not trigger an infinite loop. Playwright would stop it after 5 seconds.
    */
    
    await expect(page.getByPlaceholder('Search by name or email')).toBeVisible();
});


test('Search Bar Appears', async ({ page }) => {
    await expect(page.locator('.directory input')).toBeVisible();
});

test('Search bar properly retrieves names that match via the prefix', async ({ page }) => {
    const searchBar = page.getByPlaceholder('Search by name or email');
    await searchBar.fill("g");
    await expect(page.getByRole('cell', { name: 'Group Leader Demo User', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Guest Demo User', exact: true })).toBeVisible();
});
