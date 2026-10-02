import { expect, test, type Page } from '@playwright/test';

// Runs with auth off (see playwright.config.ts): the app shell, its routing and
// its failure pages, end to end, against the built worker.

/** The page's own content, as opposed to the shell's header and sidebar. */
const main = (page: Page) => page.locator('#main-content');

test('the dashboard renders at once and fills in what it streams', async ({ page }) => {
	await page.goto('/');

	await expect(main(page).getByRole('heading', { name: 'Dashboard' })).toBeVisible();
	// Streamed from `load` after a deliberate delay: the page did not wait for it.
	await expect(page.getByText('1,024')).toBeVisible();
});

test('navigating does not wait for what a page streams', async ({ page }) => {
	await page.goto('/admin');

	await page.getByRole('link', { name: 'Dashboard' }).click();

	// The navigation lands while the stats are still pending: skeleton first,
	// data after — instead of the old page frozen until the load resolves.
	await expect(main(page).getByRole('heading', { name: 'Dashboard' })).toBeVisible();
	await expect(page.getByLabel('Loading stats')).toBeVisible();
	await expect(page.getByText('1,024')).toBeVisible();
	await expect(page.getByLabel('Loading stats')).toBeHidden();
});

test('the sidebar navigates to a page that loads its own data', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('link', { name: 'Admin' }).click();

	await expect(page).toHaveURL('/admin');
	await expect(main(page).getByRole('heading', { name: 'Users' })).toBeVisible();
	await expect(page.getByRole('cell', { name: 'Ada Lovelace' })).toBeVisible();
});

test('a user can be created, and the list updates in place', async ({ page }) => {
	// Unique per run: the demo store lives as long as the worker, which a local
	// run may reuse.
	const email = `e2e-${Date.now()}@example.com`;

	await page.goto('/admin');
	// The list loads in `onMount`, so it showing means the page is hydrated: a
	// click before that lands on server HTML and opens nothing.
	await expect(page.getByRole('cell', { name: 'Ada Lovelace' })).toBeVisible();
	await page.getByRole('button', { name: 'New user' }).click();

	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Name').fill('End To End');
	await dialog.getByLabel('Email').fill(email);
	await dialog.getByRole('button', { name: 'Create user' }).click();

	await expect(page.getByText('User created.')).toBeVisible();
	await expect(page.getByRole('cell', { name: email, exact: true })).toBeVisible();
});

test('an unknown URL gets the 404 page', async ({ page }) => {
	const response = await page.goto('/does-not-exist');

	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
