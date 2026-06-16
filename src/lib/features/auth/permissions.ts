import {
	PERMISSION_GROUPS,
	PermissionKey,
	AUTH_ROUTE_PERMISSIONS,
	AUTH_DEFAULT_ROUTES
} from '$lib/config/domain';
import type { PermissionGroup } from '$lib/config/domain';
import { UserRole } from '$lib/types/auth/roles';

function normalizeRole(role: string | null | undefined): UserRole {
	if (role === UserRole.ADMIN) return UserRole.ADMIN;
	return UserRole.MEMBER;
}

export function resolveRole(role: string | null | undefined): UserRole {
	return normalizeRole(role);
}

export function hasPermission(role: string | null | undefined, key: PermissionGroup): boolean {
	const normalized = normalizeRole(role);
	const allowed = PERMISSION_GROUPS[key] as readonly string[];
	return allowed.includes(normalized);
}

export function hasAnyPermission(
	role: string | null | undefined,
	keys: readonly PermissionGroup[]
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

export function resolveDefaultRoute(role: string | null | undefined): string {
	if (hasPermission(role, PermissionKey.Dashboard)) return AUTH_DEFAULT_ROUTES.home;
	return AUTH_DEFAULT_ROUTES.home;
}
