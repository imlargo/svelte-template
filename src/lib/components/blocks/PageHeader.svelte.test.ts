import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import PageHeader from './PageHeader.svelte';

describe('PageHeader', () => {
	it('names the page as its heading, with what sits above and beside it', async () => {
		const screen = await render(PageHeader, {
			title: 'Users',
			description: 'Everyone in this workspace.',
			eyebrow: 'Administration',
			breadcrumbs: [{ label: 'Admin', href: '/admin' }, { label: 'Users' }],
			actions: createRawSnippet(() => ({ render: () => '<button type="button">New user</button>' }))
		});

		await expect.element(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeVisible();
		await expect.element(screen.getByText('Everyone in this workspace.')).toBeVisible();
		await expect.element(screen.getByText('Administration')).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Admin' }))
			.toHaveAttribute('href', '/admin');
		await expect.element(screen.getByRole('button', { name: 'New user' })).toBeVisible();
	});

	it('takes a snippet for a title that is more than text', async () => {
		const screen = await render(PageHeader, {
			title: createRawSnippet(() => ({ render: () => '<span>Users <em>(3)</em></span>' }))
		});

		await expect.element(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Users (3)');
	});
});
