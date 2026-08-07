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

// An empty role list means the permission is not restricted by role.
export const PERMISSION_GROUPS = {
	[PermissionKey.Dashboard]: [],
	[PermissionKey.Settings]: [UserRole.ADMIN, UserRole.MEMBER],
	[PermissionKey.Admin]: [UserRole.ADMIN]
} as const satisfies Record<PermissionKey, readonly UserRole[]>;

// Matched by prefix, so '/login' also covers '/login/callback'.
export const AUTH_PUBLIC_ROUTE_PREFIXES = ['/login', '/logout', '/authorize'] as const;

/**
 * Every authenticated route needs an entry here: routes that are not declared
 * are denied. Longest prefix wins, and '/' matches only itself. An empty role
 * list is the way to say "any signed-in user" — omitting the entry is not.
 */
export const AUTH_ROUTE_PERMISSIONS = {
	'/': [...PERMISSION_GROUPS[PermissionKey.Dashboard]],
	'/settings': [...PERMISSION_GROUPS[PermissionKey.Settings]],
	'/admin': [...PERMISSION_GROUPS[PermissionKey.Admin]]
} as const satisfies Record<string, readonly UserRole[]>;
