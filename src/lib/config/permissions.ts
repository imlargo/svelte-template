import type { EndpointRouteId, PageRouteId } from '$app/types';
import { UserRole } from '#lib/types/user.js';

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

/** What opening a page takes: a permission, or nothing. */
export type PageAccess = Permission | 'public';

/**
 * `'session'`: any signed-in user reaches the handler, which asks for its own
 * permission per method with `locals.requirePermission`.
 */
export type EndpointAccess = 'public' | 'session';

/**
 * Every page by route id, enforced by the hook before any load runs.
 * Exhaustive over `PageRouteId`: a new page without an entry fails
 * `svelte-check`, so an omission is a build error rather than an open door.
 * Should one reach the hook anyway, it is denied.
 */
export const PAGE_ACCESS = {
	'/(app)': 'dashboard:read',
	'/(app)/admin': 'users:read',
	'/(auth)/login': 'public',
	'/(auth)/logout': 'public'
} as const satisfies Record<PageRouteId, PageAccess>;

/**
 * Every endpoint by route id, same rule. The hook only checks for a session:
 * one path can need `users:read` on GET and `users:delete` on DELETE, which a
 * table cannot say, so each handler decides for itself. `/authorize` and
 * `/refresh` are public because they authenticate themselves — with Google's
 * code and with the refresh cookie the hook would otherwise reject.
 */
export const ENDPOINT_ACCESS = {
	'/(auth)/authorize': 'public',
	'/(auth)/refresh': 'public',
	'/api/users': 'session',
	'/api/users/[id]': 'session'
} as const satisfies Record<EndpointRouteId, EndpointAccess>;
