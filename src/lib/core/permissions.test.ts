import { describe, expect, it } from 'vitest';
import { hasPermission, isPrefixOf } from './permissions';
import { ROLE_PERMISSIONS, type Permission } from '#lib/config/permissions.js';
import { UserRole } from '#lib/types/user.js';

// This is the access control of the app: the role × permission matrix is
// asserted in full, and the unknown role is the case that must fail shut.
// Which route takes what is guard.server.test.ts; enforcement itself is
// handler.server.test.ts.

describe('hasPermission', () => {
	const matrix: Array<[UserRole, Permission, boolean]> = [
		[UserRole.ADMIN, 'dashboard:read', true],
		[UserRole.ADMIN, 'users:read', true],
		[UserRole.ADMIN, 'users:write', true],
		[UserRole.ADMIN, 'users:delete', true],
		[UserRole.MEMBER, 'dashboard:read', true],
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

describe('isPrefixOf', () => {
	// The sidebar's notion of "active": an entry lights up for its own page and
	// everything nested under it, and nothing else.
	it('matches the route itself and its nested paths', () => {
		expect(isPrefixOf('/admin', '/admin')).toBe(true);
		expect(isPrefixOf('/admin', '/admin/users')).toBe(true);
	});

	it('does not let the root act as a prefix for every path', () => {
		expect(isPrefixOf('/', '/')).toBe(true);
		expect(isPrefixOf('/', '/admin')).toBe(false);
	});

	it('does not match a sibling that merely shares a prefix string', () => {
		expect(isPrefixOf('/admin', '/admin-panel')).toBe(false);
	});
});
