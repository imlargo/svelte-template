import HomeIcon from '@lucide/svelte/icons/house';
import SettingsIcon from '@lucide/svelte/icons/settings';
import ShieldIcon from '@lucide/svelte/icons/shield';
import { PermissionKey } from './permissions';

export enum NavigationGroup {
	Main = 'main',
	Admin = 'admin'
}

export interface NavigationItem {
	title: string;
	// Lucide icon component — typed as `any` to avoid per-icon import generics
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
	to: string;
	group: NavigationGroup;
	requiredPermissions: PermissionKey[];
}

// ─── Navigation items ─────────────────────────────────────────────────────────
// Add/remove items here. The sidebar and site-header derive from this list.
export const NAVIGATION_ITEMS: NavigationItem[] = [
	{
		title: 'Dashboard',
		icon: HomeIcon,
		to: '/',
		group: NavigationGroup.Main,
		requiredPermissions: [PermissionKey.Dashboard]
	},
	{
		title: 'Settings',
		icon: SettingsIcon,
		to: '/settings',
		group: NavigationGroup.Main,
		requiredPermissions: [PermissionKey.Settings]
	},
	{
		title: 'Admin',
		icon: ShieldIcon,
		to: '/admin',
		group: NavigationGroup.Admin,
		requiredPermissions: [PermissionKey.Admin]
	}
];

export const NAVIGATION_GROUP_LABELS: Record<NavigationGroup, string> = {
	[NavigationGroup.Main]: 'Main',
	[NavigationGroup.Admin]: 'Administration'
};
