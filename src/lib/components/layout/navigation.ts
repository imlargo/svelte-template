/**
 * What the sidebar and the mobile bottom bar share: which entries this user
 * sees, how the user is displayed, and the theme choices. Presentation only;
 * the hook enforces the same table.
 */
import { resetMode, setMode } from 'mode-watcher';
import SunIcon from '@lucide/svelte/icons/sun';
import MoonIcon from '@lucide/svelte/icons/moon';
import MonitorIcon from '@lucide/svelte/icons/monitor';
import type { LucideIcon } from '@lucide/svelte';
import { config } from '#lib/config/app.js';
import {
	NAVIGATION_GROUP_LABELS,
	NAVIGATION_ITEMS,
	NavigationGroup,
	type NavigationItem,
	type NavigationSection
} from '#lib/config/navigation.js';
import { ROLE_LABELS, ROLE_PERMISSIONS, ROUTE_ACCESS } from '#lib/config/permissions.js';
import { hasPermission } from '#lib/core/permissions.js';
import type { User } from '#lib/types/user.js';

export function visibleNavigationItems(user: User | null): NavigationItem[] {
	if (!config.auth.enabled) return NAVIGATION_ITEMS;
	return NAVIGATION_ITEMS.filter((item) => {
		const access = ROUTE_ACCESS[item.route];
		return access === 'public' || hasPermission(ROLE_PERMISSIONS, user?.role, access);
	});
}

export function navigationSections(user: User | null): NavigationSection[] {
	const items = visibleNavigationItems(user);
	return Object.values(NavigationGroup)
		.map((group) => ({
			label: NAVIGATION_GROUP_LABELS[group],
			items: items.filter((item) => item.group === group)
		}))
		.filter((section) => section.items.length > 0);
}

export interface DisplayUser {
	name: string;
	email: string;
	roleLabel: string;
	avatar: string | null;
}

export function displayUser(user: User | null): DisplayUser {
	return {
		name: user?.name ?? user?.email ?? 'User',
		email: user?.email ?? '',
		roleLabel: user ? (ROLE_LABELS[user.role] ?? user.role) : '',
		avatar: user?.avatar ?? null
	};
}

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: ReadonlyArray<{
	value: ThemePreference;
	label: string;
	icon: LucideIcon;
}> = [
	{ value: 'light', label: 'Light', icon: SunIcon },
	{ value: 'dark', label: 'Dark', icon: MoonIcon },
	{ value: 'system', label: 'System', icon: MonitorIcon }
];

export function selectTheme(value: ThemePreference): void {
	if (value === 'system') resetMode();
	else setMode(value);
}
