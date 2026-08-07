import { describe, expect, it } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { createPermissionGuard } from './guard.server';
import type { Permission } from '$lib/config/permissions';
import { UserRole, type User } from '$lib/types/user';

// The guard is the enforcement point: every protected route calls it, so what
// it lets through is what the app lets through.

function userWith(role: string): User {
	return {
		id: '1',
		name: 'Test',
		email: 'test@example.com',
		role: role as UserRole,
		avatar: null,
		created_at: '2024-01-01T00:00:00.000Z',
		updated_at: '2024-01-01T00:00:00.000Z'
	};
}

/** Returns the HTTP status the guard threw, or null if it let the call pass. */
function statusFor(user: User | null, permission: Permission): number | null {
	try {
		createPermissionGuard(() => user)(permission);
		return null;
	} catch (err) {
		if (isHttpError(err)) return err.status;
		throw err;
	}
}

describe('createPermissionGuard', () => {
	it('lets a role holding the permission through', () => {
		expect(statusFor(userWith(UserRole.ADMIN), 'users:delete')).toBeNull();
	});

	it('denies a signed-in role that does not hold it with 403', () => {
		// The B3 case: a member reaching /admin by typing the URL.
		expect(statusFor(userWith(UserRole.MEMBER), 'users:delete')).toBe(403);
	});

	it('denies a role the frontend has never heard of', () => {
		// A restrictive role added to the backend must not widen access here.
		expect(statusFor(userWith('viewer'), 'users:delete')).toBe(403);
		expect(statusFor(userWith('viewer'), 'settings:read')).toBe(403);
	});

	it('answers 401, not 403, without a session', () => {
		// The caller can tell "sign in again" from "this is not for you".
		expect(statusFor(null, 'users:delete')).toBe(401);
		expect(statusFor(null, 'dashboard:read')).toBe(401);
	});

	it('lets a lesser role through what it was granted', () => {
		// There is no "unrestricted" permission any more: a member reaches the
		// dashboard because the grant is written down, not by falling through.
		expect(statusFor(userWith(UserRole.MEMBER), 'dashboard:read')).toBeNull();
		expect(statusFor(userWith('viewer'), 'dashboard:read')).toBe(403);
	});
});
