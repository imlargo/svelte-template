import { describe, expect, it } from 'vitest';
import { hasPermission, permissionForRoute } from './permissions';
import { AUTH_ROUTE_PERMISSIONS, ROLE_PERMISSIONS } from '$lib/config/permissions';
import { UserRole } from '$lib/types/user';

// This is the access control of the app: the role × permission matrix is
// asserted in full, and the unknown role and the undeclared page are the cases
// that must fail shut. Enforcement itself is guard.server.test.ts and
// handler.server.test.ts.

describe('hasPermission', () => {
	const matrix: Array<[UserRole, string, boolean]> = [
		[UserRole.ADMIN, 'dashboard:read', true],
		[UserRole.ADMIN, 'settings:read', true],
		[UserRole.ADMIN, 'users:read', true],
		[UserRole.ADMIN, 'users:write', true],
		[UserRole.ADMIN, 'users:delete', true],
		[UserRole.MEMBER, 'dashboard:read', true],
		[UserRole.MEMBER, 'settings:read', true],
		[UserRole.MEMBER, 'users:read', false],
		[UserRole.MEMBER, 'users:write', false],
		[UserRole.MEMBER, 'users:delete', false]
	];

	it.each(matrix)('%s %s the permission %s', (role, permission, expected) => {
		expect(hasPermission(ROLE_PERMISSIONS, role, permission)).toBe(expected);
	});

	it('grants nothing to a role the frontend has never heard of', () => {
		// A role added to the backend arrives with no grants, so a restrictive new
		// role cannot widen access here by falling back to a known one.
		expect(hasPermission(ROLE_PERMISSIONS, 'viewer', 'dashboard:read')).toBe(false);
		expect(hasPermission(ROLE_PERMISSIONS, 'viewer', 'users:delete')).toBe(false);
	});

	it('grants nothing without a role', () => {
		expect(hasPermission(ROLE_PERMISSIONS, null, 'dashboard:read')).toBe(false);
		expect(hasPermission(ROLE_PERMISSIONS, undefined, 'dashboard:read')).toBe(false);
	});
});

describe('permissionForRoute', () => {
	it('resolves each declared page to its permission', () => {
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/')).toBe('dashboard:read');
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/settings')).toBe('settings:read');
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/admin')).toBe('users:read');
	});

	it('applies a declared page to everything nested under it', () => {
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/admin/users')).toBe('users:read');
	});

	it('returns null for a page that is not declared', () => {
		// Null is the deny case: callers must not read it as "unrestricted".
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/reports')).toBeNull();
	});

	it('does not let the root entry act as a prefix for every path', () => {
		// Every role holds 'dashboard:read'; '/admin' must not inherit it.
		expect(permissionForRoute(AUTH_ROUTE_PERMISSIONS, '/admin')).not.toBe('dashboard:read');
	});

	it('resolves with the longest matching prefix, not the first one', () => {
		const routes = { '/admin': 'users:read', '/admin/danger': 'users:delete' } as const;

		expect(permissionForRoute(routes, '/admin/danger')).toBe('users:delete');
		expect(permissionForRoute(routes, '/admin/danger/nested')).toBe('users:delete');
		expect(permissionForRoute(routes, '/admin/other')).toBe('users:read');
	});

	it('does not match a sibling that merely shares a prefix string', () => {
		const routes = { '/admin': 'users:read' } as const;

		expect(permissionForRoute(routes, '/admin-panel')).toBeNull();
	});
});
