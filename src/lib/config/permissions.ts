import type { EndpointRouteId, PageRouteId } from '$app/types';
import { UserRole } from '#lib/types/user.js';

/** A capability as `resource:action`, independent of where in the UI it is used. */
export type Permission = 'dashboard:read' | 'users:read' | 'users:write' | 'users:delete';

export const ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Admin',
	[UserRole.MEMBER]: 'Member'
};

/** A role holds exactly what is listed; a role the backend adds later holds nothing. */
export const ROLE_PERMISSIONS = {
	[UserRole.ADMIN]: ['dashboard:read', 'users:read', 'users:write', 'users:delete'],
	[UserRole.MEMBER]: ['dashboard:read']
} as const satisfies Record<UserRole, readonly Permission[]>;

export type RouteAccess = Permission | 'public' | 'session';

/**
 * What the hook requires for every route, by route id. A page needs a
 * permission or is `'public'`. An endpoint is `'public'` or `'session'`: the
 * hook checks for a session and the handler asks for its own permission per
 * method with `locals.requirePermission`.
 *
 * Exhaustive over the route ids SvelteKit generates, so a new route without
 * an entry fails `svelte-check`.
 */
export const ROUTE_ACCESS = {
	'/(app)': 'dashboard:read',
	'/(app)/admin': 'users:read',
	'/(auth)/login': 'public',
	'/(auth)/logout': 'public',
	'/(auth)/authorize': 'public',
	'/(auth)/refresh': 'public',
	'/api/users': 'session',
	'/api/users/[id]': 'session'
} as const satisfies Record<PageRouteId, Permission | 'public'> &
	Record<EndpointRouteId, 'public' | 'session'>;
