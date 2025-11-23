import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/api/auth/login');
    await page.goto('/dashboard.html');
    await page.waitForLoadState('domcontentloaded');
    await page.getByTestId('directory-tab').click();
});


test('Class Directory title appears', async ({ page }) => {
    await expect(page.getByText('Class Directory')).toBeVisible();
});

test('Search Bar Appears', async ({ page }) => {
    await expect(page.locator('.directory input')).toBeVisible();
})
