import { UserRole } from '$lib/types/user';

export enum PermissionKey {
	Dashboard = 'Dashboard',
	Settings = 'Settings',
	Admin = 'Admin'
}

export const ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Admin',
	[UserRole.MEMBER]: 'Member'
};

export const PERMISSION_GROUPS = {
	[PermissionKey.Dashboard]: [UserRole.ADMIN, UserRole.MEMBER],
	[PermissionKey.Settings]: [UserRole.ADMIN, UserRole.MEMBER],
	[PermissionKey.Admin]: [UserRole.ADMIN]
} as const satisfies Record<PermissionKey, readonly UserRole[]>;

// Matched by prefix, so '/login' also covers '/login/callback'.
export const AUTH_PUBLIC_ROUTE_PREFIXES = ['/login', '/logout', '/authorize'] as const;

/**
 * Every authenticated route needs an entry here: routes that are not declared
 * are denied. Longest prefix wins, and '/' matches only itself.
 */
export const AUTH_ROUTE_PERMISSIONS = {
	'/': [...PERMISSION_GROUPS[PermissionKey.Dashboard]],
	'/settings': [...PERMISSION_GROUPS[PermissionKey.Settings]],
	'/admin': [...PERMISSION_GROUPS[PermissionKey.Admin]]
} as const satisfies Record<string, readonly UserRole[]>;
