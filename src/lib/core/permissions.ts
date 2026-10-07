/**
 * Role checks, project-agnostic: the grants are passed in (`#lib/config/permissions`).
 * Enforcement is `locals.requirePermission` (`features/auth/guard.server.ts`).
 */

/** Deny by default: an unknown or missing role holds nothing. */
export function hasPermission<P extends string>(
	grants: Readonly<Record<string, readonly P[]>>,
	role: string | null | undefined,
	permission: P
): boolean {
	// `hasOwn`: a role named like a prototype member must not reach Object.prototype.
	if (!role || !Object.hasOwn(grants, role)) return false;
	return grants[role].includes(permission);
}
