import { test, expect } from '@playwright/test'

/*
This file contains a test suite of integration tests for the evaluation screen.
Since the evaluation screen doesn't have much, all it can really check for is the current rendered text.
*/

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    const loginButton = page.locator('a#google-login');
    await loginButton.click();
    await page.getByTestId('evaluation-tab').click();
    await expect(page.getByText('Evaluation content will be here...')).toBeVisible();
});

test('evaluation main text appears', async ({ page }) => {
    await expect(page.getByText('Evaluation content will be here...')).toBeVisible();
});