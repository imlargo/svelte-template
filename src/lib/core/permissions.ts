/**
 * Role-based access checks, project-agnostic: the data is always passed in
 * (see `$lib/config/permissions`). These answer questions; enforcement is
 * `locals.requirePermission` (`features/auth/guard.server.ts`).
 */

/** Maps a role to everything it may do. */
export type RolePermissions<R extends string, P extends string> = Record<R, readonly P[]>;

/** Maps a page route prefix to the permission needed to open it. */
export type RoutePermissions<P extends string> = Record<string, P>;

/** Deny by default: an unknown or missing role holds nothing. */
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
 * Whether `pathname` is `route` or sits under it, by whole segments: '/admin'
 * covers '/admin/users' but not '/admin-panel', and '/' matches only itself.
 */
export function isPrefixOf(route: string, pathname: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * The permission a page needs, by longest matching prefix, or null when the
 * page is not declared — which callers must treat as denied.
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
