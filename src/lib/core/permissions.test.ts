import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';
import { ROLE_PERMISSIONS, type Permission } from '#lib/config/permissions.js';
import { UserRole } from '#lib/types/user.js';

// The role × permission matrix in full; the unknown role is the case that must fail shut.

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
