import { describe, expect, it } from 'vitest';
import HomeIcon from '@lucide/svelte/icons/house';
import {
	NAVIGATION_ITEMS,
	NavigationGroup,
	navigationSections,
	type NavigationItem
} from './navigation';
import { UserRole, type User } from '#lib/types/user.js';

function userWith(role: UserRole): User {
	return { id: '1', email: 'a@example.com', role, created_at: '', updated_at: '' };
}

const admin = userWith(UserRole.ADMIN);
const member = userWith(UserRole.MEMBER);

describe('navigationSections', () => {
	it('shows a role only the entries the route table lets it open', () => {
		const titles = (user: User | null) =>
			navigationSections(user).flatMap((section) => section.items.map((item) => item.title));

		expect(titles(admin)).toEqual(['Dashboard', 'Admin']);
		expect(titles(member)).toEqual(['Dashboard']);
		expect(titles(null)).toEqual([]);
	});

	it('drops a group left with nothing instead of rendering an empty label', () => {
		expect(navigationSections(member).map((section) => section.group)).toEqual([
			NavigationGroup.MAIN
		]);
	});

	it('carries the label and placement of each group', () => {
		const [main, administration] = navigationSections(admin);

		expect(main).toMatchObject({ label: 'Main', placement: 'main' });
		expect(administration).toMatchObject({ label: 'Administration', placement: 'main' });
	});

	it('hides an entry whose condition fails, without granting one the table denies', () => {
		const items: NavigationItem[] = [
			{ ...NAVIGATION_ITEMS[0], when: () => false },
			{ ...NAVIGATION_ITEMS[1], when: () => true }
		];

		expect(navigationSections(admin, items).flatMap((s) => s.items.map((i) => i.title))).toEqual([
			'Admin'
		]);
		expect(navigationSections(member, items)).toEqual([]);
	});

	it('filters the sub-items by the same table', () => {
		const items: NavigationItem[] = [
			{
				title: 'Home',
				icon: HomeIcon,
				route: '/(app)',
				group: NavigationGroup.MAIN,
				items: [
					{ title: 'Overview', route: '/(app)' },
					{ title: 'Users', route: '/(app)/admin' }
				]
			}
		];

		const subTitles = (user: User) =>
			navigationSections(user, items)[0].items[0].items?.map((sub) => sub.title);

		expect(subTitles(admin)).toEqual(['Overview', 'Users']);
		expect(subTitles(member)).toEqual(['Overview']);
	});
});
