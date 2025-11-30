import { test, expect } from '@playwright/test'

/*
This file contains a test suite of integration tests for the journal screen.
It checks for existence of the main framework for journal entry, from the title to the button for opening the journal modal.
It also checks for functionality of a full journal entry.
*/

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard.html');
    /*
    await expect(page.locator('a#google-login')).toBeVisible();
    const loginButton = page.locator('a#google-login');
    await loginButton.click();
    */
    await page.getByTestId('journal-tab').click();
    await expect(page.getByText('My Journals')).toBeVisible();
});

test('Journals title properly renders', async ({ page }) => {
    await expect(page.getByText('My Journals')).toBeVisible();
});

test('New Journal button properly renders', async ({ page }) => {
    await expect(page.getByRole('button', {name: '+ New Journal'})).toBeVisible();
});

test('Journal entry works', async ({ page }) => {
    await page.getByRole('button', {name: '+ New Journal'}).click();
    await expect(page.getByPlaceholder('Describe what you accomplished since the last meeting...')).toBeVisible();
    await expect(page.getByPlaceholder('Describe what you plan to work on next...')).toBeVisible();
    await expect(page.getByPlaceholder("Describe any obstacles or issues you're facing (leave blank if none)...")).toBeVisible();
    const accomplishedField = page.getByPlaceholder('Describe what you accomplished since the last meeting...');
    const nextField = page.getByPlaceholder('Describe what you plan to work on next...');
    const blockersField = page.getByPlaceholder("Describe any obstacles or issues you're facing (leave blank if none)...");
    const submitButton = page.getByRole('button', {name: 'Submit Journal'});
    await accomplishedField.fill('Accomplished nothing');
    await nextField.fill('relax by the beach');
    await blockersField.fill('nothing');
    await submitButton.click();
    await expect(page.getByText('Accomplished nothing', {exact: true})).toBeVisible();
    await expect(page.getByText('relax by the beach', {exact: true})).toBeVisible();
    await expect(page.getByText('nothing', {exact: true})).toBeVisible();

});