import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeIcon from '@lucide/svelte/icons/house';
import ShieldIcon from '@lucide/svelte/icons/shield';
import HelpIcon from '@lucide/svelte/icons/circle-help';
import NavMainHarness from './NavMain.test-harness.svelte';
import { NavigationGroup, type NavigationSection } from '#lib/config/navigation.js';

// No router in a component test: the page is fixed and a route resolves to its pathname.
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/admin?tab=users') } }));
vi.mock('$app/paths', () => ({
	resolve: (route: string) => route.replace(/\/\([^)]+\)/g, '') || '/'
}));

const sections: NavigationSection[] = [
	{
		group: NavigationGroup.MAIN,
		label: 'Main',
		placement: 'main',
		items: [
			{
				title: 'Dashboard',
				icon: HomeIcon,
				route: '/(app)',
				group: NavigationGroup.MAIN,
				badge: { label: 'New', tone: 'success' }
			},
			{
				title: 'Admin',
				icon: ShieldIcon,
				route: '/(app)/admin',
				group: NavigationGroup.MAIN,
				items: [
					{ title: 'Users', route: '/(app)/admin', search: '?tab=users' },
					{ title: 'Roles', route: '/(app)/admin', search: '?tab=roles' }
				]
			}
		]
	},
	{
		group: NavigationGroup.ADMIN,
		label: 'Support',
		placement: 'bottom',
		items: [{ title: 'Get help', icon: HelpIcon, route: '/(app)', group: NavigationGroup.ADMIN }]
	}
];

describe('NavMain', () => {
	it('marks the entry of the current page and opens the group it sits in', async () => {
		const screen = await render(NavMainHarness, { sections });

		await expect
			.element(screen.getByRole('link', { name: 'Users' }))
			.toHaveAttribute('aria-current', 'page');
		await expect.element(screen.getByRole('link', { name: 'Roles' })).toBeVisible();
		await expect
			.element(screen.getByRole('link', { name: 'Admin' }))
			.not.toHaveAttribute('aria-current');
		await expect
			.element(screen.getByRole('link', { name: 'Dashboard' }))
			.not.toHaveAttribute('aria-current');
	});

	it('shows a badge next to its entry', async () => {
		const screen = await render(NavMainHarness, { sections });

		await expect.element(screen.getByText('New')).toBeVisible();
	});

	it('names a bottom group for assistive tech without printing its label', async () => {
		const screen = await render(NavMainHarness, { sections });

		await expect.element(screen.getByRole('list', { name: 'Support' })).toBeVisible();
		expect(screen.getByText('Support', { exact: true }).query()).toBeNull();
		await expect.element(screen.getByText('Main', { exact: true })).toBeVisible();
	});
});
