import { test, expect } from '@playwright/test';

test.beforeAll(() => {
  process.env.MOCK_EMAIL = "ian@example.com";
});

test.afterAll(() => {
  process.env.MOCK_EMAIL = "alice@example.com";
});

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    const loginButton = page.locator('a#google-login');
    loginButton.click();
    await page.getByTestId('directory-tab').click();
    await expect(page.getByText('Class Directory')).toBeVisible();
});


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


