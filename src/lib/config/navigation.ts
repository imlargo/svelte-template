import HomeIcon from '@lucide/svelte/icons/house';
import ShieldIcon from '@lucide/svelte/icons/shield';
import type { LucideIcon } from '@lucide/svelte';
import type { User } from '#lib/types/user.js';
import type { Tone } from '#lib/utils/tone.js';
import type { StaticPageRouteId } from '#lib/utils/paths.js';
import { hasPermission } from '#lib/core/permissions.js';
import { ROLE_PERMISSIONS, ROUTE_ACCESS } from './permissions.js';

export enum NavigationGroup {
	MAIN = 'main',
	ADMIN = 'admin'
}

/** `main` groups carry their label; `bottom` groups sit at the foot of the sidebar without one. */
export type NavigationPlacement = 'main' | 'bottom';

export interface NavigationGroupConfig {
	label: string;
	placement: NavigationPlacement;
}

/** A small chip after the title: "New", "Beta", a count. */
export interface NavigationBadge {
	label: string;
	tone: Tone;
}

/** A page under an item, opened by its chevron. `search` lists one page under several entries (`?tab=…`). */
export interface NavigationSubItem {
	title: string;
	route: StaticPageRouteId;
	search?: string;
}

/** A sidebar entry: `resolve(route)` is its href, `ROUTE_ACCESS[route]` decides who sees it. */
export interface NavigationItem {
	title: string;
	icon: LucideIcon;
	route: StaticPageRouteId;
	group: NavigationGroup;
	badge?: NavigationBadge;
	items?: NavigationSubItem[];
	/** A condition beyond the route table: a plan, a flag, an owner check. Hides the entry, never grants it. */
	when?: (user: User | null) => boolean;
}

export interface NavigationSection {
	group: NavigationGroup;
	label: string;
	placement: NavigationPlacement;
	items: NavigationItem[];
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
	{ title: 'Dashboard', icon: HomeIcon, route: '/(app)', group: NavigationGroup.MAIN },
	{ title: 'Admin', icon: ShieldIcon, route: '/(app)/admin', group: NavigationGroup.ADMIN }
];

export const NAVIGATION_GROUPS: Record<NavigationGroup, NavigationGroupConfig> = {
	[NavigationGroup.MAIN]: { label: 'Main', placement: 'main' },
	[NavigationGroup.ADMIN]: { label: 'Administration', placement: 'main' }
};

/** Presentation only: the hook enforces the same table. */
function canOpen(user: User | null, entry: NavigationItem | NavigationSubItem): boolean {
	const access = ROUTE_ACCESS[entry.route];
	if (access !== 'public' && !hasPermission(ROLE_PERMISSIONS, user?.role, access)) return false;
	return 'when' in entry ? (entry.when?.(user) ?? true) : true;
}

/**
 * The sections `user` sees, in the order of `NavigationGroup`, each item with
 * the sub-items they may open. A group left with nothing is dropped. Pass
 * `items` to add what the config cannot know, such as entries loaded at runtime.
 */
export function navigationSections(
	user: User | null,
	items: readonly NavigationItem[] = NAVIGATION_ITEMS
): NavigationSection[] {
	return Object.values(NavigationGroup)
		.map((group) => ({
			group,
			...NAVIGATION_GROUPS[group],
			items: items
				.filter((item) => item.group === group && canOpen(user, item))
				.map((item) =>
					item.items ? { ...item, items: item.items.filter((sub) => canOpen(user, sub)) } : item
				)
		}))
		.filter((section) => section.items.length > 0);
}
