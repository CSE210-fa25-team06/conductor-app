import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    const loginButton = page.locator('a#google-login');
    loginButton.click();
    await page.getByTestId('evaluation-tab').click();
    await expect(page.getByText('Evaluation content will be here...')).toBeVisible();
});

test('evaluation main text appears', async ({ page }) => {
    await expect(page.getByText('Evaluation content will be here...')).toBeVisible();
});