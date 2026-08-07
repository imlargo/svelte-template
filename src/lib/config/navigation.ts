import HomeIcon from '@lucide/svelte/icons/house';
import SettingsIcon from '@lucide/svelte/icons/settings';
import ShieldIcon from '@lucide/svelte/icons/shield';
import type { LucideIcon } from '@lucide/svelte';
import type { Permission } from '$lib/config/permissions';

export enum NavigationGroup {
	Main = 'main',
	Admin = 'admin'
}

export interface NavigationItem {
	title: string;
	icon: LucideIcon;
	// Not typed as $app/types' Pathname: /settings and /admin are placeholders
	// for routes this starter doesn't ship yet. Add the routes, then tighten this.
	to: string;
	group: NavigationGroup;
	/**
	 * Hides the item when the user lacks it. Presentation only — the hook is what
	 * enforces the route, and it looks the permission up in
	 * AUTH_ROUTE_PERMISSIONS. Keep the two in agreement or the menu will offer a
	 * link that 403s.
	 */
	requiredPermission: Permission;
}

// ─── Navigation items ─────────────────────────────────────────────────────────
// Add/remove items here. The sidebar and site-header derive from this list.
export const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		title: 'Dashboard',
		icon: HomeIcon,
		to: '/',
		group: NavigationGroup.Main,
		requiredPermission: 'dashboard:read'
	},
	{
		title: 'Settings',
		icon: SettingsIcon,
		to: '/settings',
		group: NavigationGroup.Main,
		requiredPermission: 'settings:read'
	},
	{
		title: 'Admin',
		icon: ShieldIcon,
		to: '/admin',
		group: NavigationGroup.Admin,
		requiredPermission: 'users:read'
	}
];

export const NAVIGATION_GROUP_LABELS: Record<NavigationGroup, string> = {
	[NavigationGroup.Main]: 'Main',
	[NavigationGroup.Admin]: 'Administration'
};
