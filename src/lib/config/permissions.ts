import { UserRole } from '#lib/types/user.js';
import { AUTH_ROUTES } from '#lib/config/routes.js';

/**
 * What can be done, as `resource:action`: a capability, not a place in the UI,
 * so `users:delete` still means the same after the page that used it moves.
 */
export type Permission = 'dashboard:read' | 'users:read' | 'users:write' | 'users:delete';

export const ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Admin',
	[UserRole.MEMBER]: 'Member'
};

/**
 * The whole authorization model, shared by pages and endpoints. A role holds
 * exactly what is listed here, so a role the backend invents tomorrow can do
 * nothing until it is added.
 */
export const ROLE_PERMISSIONS = {
	[UserRole.ADMIN]: ['dashboard:read', 'users:read', 'users:write', 'users:delete'],
	[UserRole.MEMBER]: ['dashboard:read']
} as const satisfies Record<UserRole, readonly Permission[]>;

/**
 * Reachable without a session, matched by prefix. Everything else requires
 * one. `/refresh` is here because it authenticates itself with the refresh
 * cookie: the hook would reject the expired access token it exists to replace.
 */
export const PUBLIC_ROUTE_PREFIXES: readonly string[] = Object.values(AUTH_ROUTES);

/**
 * The permission each **page** needs, enforced by the hook before any load
 * runs. A page missing from here is denied. Endpoints under `/api` are absent
 * on purpose: each handler asks for its own permission, per method.
 */
export const AUTH_ROUTE_PERMISSIONS = {
	'/': 'dashboard:read',
	'/admin': 'users:read'
} as const satisfies Record<string, Permission>;
