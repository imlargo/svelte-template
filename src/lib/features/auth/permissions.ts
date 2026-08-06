import {
	PERMISSION_GROUPS,
	AUTH_ROUTE_PERMISSIONS,
	AUTH_DEFAULT_ROUTES,
	PermissionKey
} from '$lib/config/domain';
import { UserRole } from '$lib/types/auth/roles';

function normalizeRole(role: string | null | undefined): UserRole {
	if (role === UserRole.ADMIN) return UserRole.ADMIN;
	return UserRole.MEMBER;
}

export function resolveRole(role: string | null | undefined): UserRole {
	return normalizeRole(role);
}

export function hasPermission(role: string | null | undefined, key: PermissionKey): boolean {
	const normalized = normalizeRole(role);
	const allowed = PERMISSION_GROUPS[key] as readonly string[];
	return allowed.includes(normalized);
}

export function hasAnyPermission(
	role: string | null | undefined,
	keys: readonly PermissionKey[]
): boolean {
	return keys.some((key) => hasPermission(role, key));
}

export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
	const normalized = normalizeRole(role);
	for (const [route, allowedRoles] of Object.entries(AUTH_ROUTE_PERMISSIONS)) {
		if (pathname === route || pathname.startsWith(`${route}/`)) {
			return (allowedRoles as readonly string[]).includes(normalized);
		}
	}
	return true;
}

/**
 * First route the role can actually reach — use it after login so a user is not
 * sent to a page that would immediately bounce them.
 */
export function resolveDefaultRoute(role: string | null | undefined): string {
	if (canAccessRoute(role, AUTH_DEFAULT_ROUTES.home)) return AUTH_DEFAULT_ROUTES.home;

	const reachable = Object.keys(AUTH_ROUTE_PERMISSIONS).find((route) =>
		canAccessRoute(role, route)
	);
	return reachable ?? AUTH_DEFAULT_ROUTES.home;
}
