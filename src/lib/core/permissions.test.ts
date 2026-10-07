import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';
import { ROLE_PERMISSIONS, type Permission } from '#lib/config/permissions.js';
import { UserRole } from '#lib/types/user.js';

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
		expect(hasPermission(ROLE_PERMISSIONS, 'viewer', 'dashboard:read')).toBe(false);
		expect(hasPermission(ROLE_PERMISSIONS, 'viewer', 'users:delete')).toBe(false);
	});

	it('grants nothing without a role', () => {
		expect(hasPermission(ROLE_PERMISSIONS, null, 'dashboard:read')).toBe(false);
		expect(hasPermission(ROLE_PERMISSIONS, undefined, 'dashboard:read')).toBe(false);
	});
});
