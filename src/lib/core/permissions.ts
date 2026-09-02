/**
 * Role-based access checks. Pure and project-agnostic: the permission data is
 * always passed in, so this module knows nothing about the roles, permissions
 * or routes of any particular app. See `$lib/config/permissions` for the data.
 *
 * Deny by default, and it falls out of the data rather than being bolted on: a
 * role holds exactly the permissions granted to it, so a role the frontend has
 * never heard of resolves to no grants at all and is denied without a single
 * special case. There is no "unrestricted" value to get wrong.
 *
 * This module answers questions; it does not enforce anything. Enforcement is
 * `locals.requirePermission` (`features/auth/guard.server.ts`).
 */

/** Maps a role to everything it may do. */
export type RolePermissions<R extends string, P extends string> = Record<R, readonly P[]>;

/** Maps a page route prefix to the permission needed to open it. */
export type RoutePermissions<P extends string> = Record<string, P>;

export function hasPermission<R extends string, P extends string>(
	grants: RolePermissions<R, P>,
	role: string | null | undefined,
	permission: P
): boolean {
	if (!role) return false;
	const granted: readonly P[] | undefined = (grants as Record<string, readonly P[]>)[role];
	return granted?.includes(permission) ?? false;
}

/**
 * Whether `pathname` is `route` or sits under it, matching whole segments only:
 * '/admin' covers '/admin/users' but not '/admin-panel'.
 *
 * The root entry needs no special case — it compares against '//', so '/'
 * matches itself and nothing else. That matters: as a plain string prefix it
 * would swallow every path and undo the deny-by-default.
 */
export function isPrefixOf(route: string, pathname: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * The permission a page route needs, or null when the route is not declared —
 * which callers must treat as denied. Longest prefix wins, so '/admin/users'
 * uses its own rule when it has one instead of the shallower '/admin'.
 *
 * Page routes only. Endpoints declare theirs per handler: the same path answers
 * to several methods, and this table has one entry per path.
 */
export function permissionForRoute<P extends string>(
	routes: RoutePermissions<P>,
	pathname: string
): P | null {
	let best: P | null = null;
	let bestLength = -1;

	for (const [route, permission] of Object.entries(routes) as [string, P][]) {
		if (isPrefixOf(route, pathname) && route.length > bestLength) {
			best = permission;
			bestLength = route.length;
		}
	}

	return best;
}
