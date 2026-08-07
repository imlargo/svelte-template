import { describe, expect, it } from 'vitest';
import {
	canAccessRoute,
	hasAnyPermission,
	hasPermission,
	type PermissionGroups
} from './permissions';
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
		expect(hasPermission(PERMISSION_GROUPS, 'viewer', PermissionKey.Settings)).toBe(false);
		expect(hasPermission(PERMISSION_GROUPS, null, PermissionKey.Settings)).toBe(false);
		expect(hasPermission(PERMISSION_GROUPS, undefined, PermissionKey.Settings)).toBe(false);
	});

	it('grants a permission declared with no roles to anyone', () => {
		// Dashboard is the app's own unrestricted permission.
		expect(hasPermission(PERMISSION_GROUPS, UserRole.MEMBER, PermissionKey.Dashboard)).toBe(true);
		expect(hasPermission(PERMISSION_GROUPS, 'viewer', PermissionKey.Dashboard)).toBe(true);
		expect(hasPermission(PERMISSION_GROUPS, null, PermissionKey.Dashboard)).toBe(true);
	});

	it('denies a key that is not declared at all', () => {
		// The cast stands in for config drift: the key exists for the type but
		// not in the data, which is the case that must not fall through to true.
		const groups = { Open: [] } as unknown as PermissionGroups<'Open' | 'Missing', UserRole>;

		expect(hasPermission(groups, UserRole.ADMIN, 'Missing')).toBe(false);
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

	it('fails when no key is held', () => {
		expect(hasAnyPermission(PERMISSION_GROUPS, UserRole.MEMBER, [PermissionKey.Admin])).toBe(false);
	});

	it('passes when nothing is required', () => {
		expect(hasAnyPermission(PERMISSION_GROUPS, UserRole.MEMBER, [])).toBe(true);
		expect(hasAnyPermission(PERMISSION_GROUPS, null, [])).toBe(true);
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

	it('lets any role into a route declared with no roles', () => {
		const routes = { '/docs': [] as UserRole[] };

		expect(canAccessRoute(routes, UserRole.MEMBER, '/docs')).toBe(true);
		expect(canAccessRoute(routes, 'viewer', '/docs/nested')).toBe(true);
		expect(canAccessRoute(routes, null, '/docs')).toBe(true);
		// Still denied: the entry is missing, not empty.
		expect(canAccessRoute(routes, UserRole.ADMIN, '/other')).toBe(false);
	});

	it('denies unknown and missing roles on a role-restricted route', () => {
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, 'viewer', '/settings')).toBe(false);
		expect(canAccessRoute(AUTH_ROUTE_PERMISSIONS, null, '/settings')).toBe(false);
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
