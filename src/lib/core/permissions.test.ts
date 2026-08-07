import { describe, expect, it } from 'vitest';
import { canAccessRoute, hasAnyPermission, hasPermission } from './permissions';
import { AUTH_ROUTE_PERMISSIONS, PERMISSION_GROUPS, PermissionKey } from '$lib/config/permissions';
import { UserRole } from '$lib/types/user';

// This is the access control of the app: the matrix is asserted in full, and
// the unknown role and the undeclared route are the cases that must fail shut.

describe('hasPermission', () => {
	it('grants a permission listed for the role', () => {
		expect(hasPermission(PERMISSION_GROUPS, UserRole.ADMIN, PermissionKey.Admin)).toBe(true);
		expect(hasPermission(PERMISSION_GROUPS, UserRole.MEMBER, PermissionKey.Dashboard)).toBe(true);
	});

	it('denies a permission not listed for the role', () => {
		expect(hasPermission(PERMISSION_GROUPS, UserRole.MEMBER, PermissionKey.Admin)).toBe(false);
	});

	it('denies unknown, null and undefined roles', () => {
		expect(hasPermission(PERMISSION_GROUPS, 'viewer', PermissionKey.Dashboard)).toBe(false);
		expect(hasPermission(PERMISSION_GROUPS, null, PermissionKey.Dashboard)).toBe(false);
		expect(hasPermission(PERMISSION_GROUPS, undefined, PermissionKey.Dashboard)).toBe(false);
	});
});

describe('hasAnyPermission', () => {
	it('passes when at least one key is held', () => {
		expect(
			hasAnyPermission(PERMISSION_GROUPS, UserRole.MEMBER, [
				PermissionKey.Admin,
				PermissionKey.Settings
			])
		).toBe(true);
	});

	it('fails when no key is held, and on an empty list', () => {
		expect(hasAnyPermission(PERMISSION_GROUPS, UserRole.MEMBER, [PermissionKey.Admin])).toBe(false);
		expect(hasAnyPermission(PERMISSION_GROUPS, UserRole.ADMIN, [])).toBe(false);
	});
});

describe('canAccessRoute', () => {
	const matrix: Array<[string, UserRole, boolean]> = [
		['/', UserRole.ADMIN, true],
		['/', UserRole.MEMBER, true],
		['/settings', UserRole.ADMIN, true],
		['/settings', UserRole.MEMBER, true],
		['/admin', UserRole.ADMIN, true],
		['/admin', UserRole.MEMBER, false]
	];

	it.each(matrix)('%s is %s for %s', (pathname, role, expected) => {
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, role, pathname)).toBe(expected);
	});

	it('applies a declared route to everything nested under it', () => {
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, UserRole.ADMIN, '/admin/users')).toBe(true);
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, UserRole.MEMBER, '/admin/users')).toBe(false);
	});

	it('denies a route that is not declared', () => {
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, UserRole.ADMIN, '/reports')).toBe(false);
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, UserRole.MEMBER, '/reports')).toBe(false);
	});

	it('does not let the root entry act as a prefix for every path', () => {
		// '/' allows members; '/admin' must not inherit that.
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, UserRole.MEMBER, '/admin')).toBe(false);
	});

	it('denies unknown and missing roles on a declared route', () => {
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, 'viewer', '/')).toBe(false);
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, null, '/')).toBe(false);
	});

	it('resolves with the longest matching prefix, not the first one', () => {
		const routes = {
			'/admin': [UserRole.ADMIN],
			'/admin/public': [UserRole.ADMIN, UserRole.MEMBER]
		};

		expect(canAccessRoute(routes, UserRole.MEMBER, '/admin/public')).toBe(true);
		expect(canAccessRoute(routes, UserRole.MEMBER, '/admin/public/nested')).toBe(true);
		expect(canAccessRoute(routes, UserRole.MEMBER, '/admin/secret')).toBe(false);
	});
});
