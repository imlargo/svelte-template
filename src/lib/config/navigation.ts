import HomeIcon from '@lucide/svelte/icons/house';
import ShieldIcon from '@lucide/svelte/icons/shield';
import type { LucideIcon } from '@lucide/svelte';
import type { PageRouteId } from '$app/types';

export enum NavigationGroup {
	MAIN = 'main',
	ADMIN = 'admin'
}

/** A sidebar entry: `resolve(route)` is its href, `ROUTE_ACCESS[route]` decides who sees it. */
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
