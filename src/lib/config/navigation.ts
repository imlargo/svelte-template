import HomeIcon from '@lucide/svelte/icons/house';
import ShieldIcon from '@lucide/svelte/icons/shield';
import type { LucideIcon } from '@lucide/svelte';
import type { PageRouteId } from '$app/types';

export enum NavigationGroup {
	MAIN = 'main',
	ADMIN = 'admin'
}

/**
 * A sidebar entry. Its href is `resolve(route)`, and it shows only to users
 * who may open `route` according to `PAGE_ACCESS` — the menu and the hook read
 * the same table.
 */
export interface NavigationItem {
	title: string;
	icon: LucideIcon;
	route: PageRouteId;
	group: NavigationGroup;
}

export interface NavigationSection {
	label: string;
	items: NavigationItem[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{ title: 'Dashboard', icon: HomeIcon, route: '/(app)', group: NavigationGroup.MAIN },
	{ title: 'Admin', icon: ShieldIcon, route: '/(app)/admin', group: NavigationGroup.ADMIN }
];

export const NAVIGATION_GROUP_LABELS: Record<NavigationGroup, string> = {
	[NavigationGroup.MAIN]: 'Main',
	[NavigationGroup.ADMIN]: 'Administration'
};
