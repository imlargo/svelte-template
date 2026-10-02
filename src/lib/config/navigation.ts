import HomeIcon from '@lucide/svelte/icons/house';
import ShieldIcon from '@lucide/svelte/icons/shield';
import type { LucideIcon } from '@lucide/svelte';
import type { Pathname } from '$app/types';

export enum NavigationGroup {
	MAIN = 'main',
	ADMIN = 'admin'
}

/**
 * A sidebar entry. It shows only to users who may open `to`, which is looked
 * up in `AUTH_ROUTE_PERMISSIONS` — the menu and the hook read the same table.
 */
export interface NavigationItem {
	title: string;
	icon: LucideIcon;
	to: Pathname;
	group: NavigationGroup;
}

export interface NavigationSection {
	label: string;
	items: NavigationItem[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{ title: 'Dashboard', icon: HomeIcon, to: '/', group: NavigationGroup.MAIN },
	{ title: 'Admin', icon: ShieldIcon, to: '/admin', group: NavigationGroup.ADMIN }
];

export const NAVIGATION_GROUP_LABELS: Record<NavigationGroup, string> = {
	[NavigationGroup.MAIN]: 'Main',
	[NavigationGroup.ADMIN]: 'Administration'
};
