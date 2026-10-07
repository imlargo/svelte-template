import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSIONS, type Permission } from './permissions';
import { hasPermission } from '#lib/core/permissions.js';
import { UserRole } from '#lib/types/user.js';

// The role × permission matrix in full: a change here is a change to who can do what.
describe('ROLE_PERMISSIONS', () => {
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
});
