/**
 * Role-based access checks, project-agnostic: the data is always passed in
 * (see `#lib/config/permissions`). These answer questions; enforcement is
 * `locals.requirePermission` and the route tables the hook reads
 * (`features/auth/guard.server.ts`).
 */

/** Maps a role to everything it may do. */
export type RolePermissions<R extends string, P extends string> = Record<R, readonly P[]>;

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
