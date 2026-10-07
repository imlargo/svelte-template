/**
 * Role checks, project-agnostic: the grants are passed in (`#lib/config/permissions`).
 * Enforcement is `locals.requirePermission` (`features/auth/guard.server.ts`).
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
