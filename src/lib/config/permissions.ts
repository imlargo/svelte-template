import { UserRole } from '$lib/types/auth/roles';

// ─── Permission Keys ──────────────────────────────────────────────────────────
// Add one entry per feature/section that needs access control.
export enum PermissionKey {
	Dashboard = 'Dashboard',
	Settings = 'Settings',
	Admin = 'Admin'
}

// ─── Role metadata ────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Admin',
	[UserRole.MEMBER]: 'Member'
};

// ─── Permission groups ────────────────────────────────────────────────────────
// Maps each PermissionKey to the roles that can access it.
export const PERMISSION_GROUPS = {
	[PermissionKey.Dashboard]: [UserRole.ADMIN, UserRole.MEMBER],
	[PermissionKey.Settings]: [UserRole.ADMIN, UserRole.MEMBER],
	[PermissionKey.Admin]: [UserRole.ADMIN]
} as const satisfies Record<PermissionKey, readonly UserRole[]>;

// ─── Route-level access control ───────────────────────────────────────────────
// Single source of truth for routes reachable without a session. Consumed by
// `config.auth.publicRoutes` and matched by prefix, so '/login' also covers
// '/login/callback'. Add new unauthenticated routes here and nowhere else.
export const AUTH_PUBLIC_ROUTE_PREFIXES = ['/login', '/register', '/logout', '/authorize'] as const;

export const AUTH_ROUTE_PERMISSIONS = {
	'/': [...PERMISSION_GROUPS[PermissionKey.Dashboard]],
	'/settings': [...PERMISSION_GROUPS[PermissionKey.Settings]],
	'/admin': [...PERMISSION_GROUPS[PermissionKey.Admin]]
} as const satisfies Record<string, readonly UserRole[]>;

export const AUTH_DEFAULT_ROUTES = {
	home: '/',
	settings: '/settings'
} as const;
