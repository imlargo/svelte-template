import { describe, expect, it } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { createPermissionGuard, routeAccess } from './guard.server';
import type { Permission } from '#lib/config/permissions.js';
import { UserRole, type User } from '#lib/types/user.js';

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
		// A member reaching /admin by typing the URL.
		expect(statusFor(userWith(UserRole.MEMBER), 'users:delete')).toBe(403);
	});

	it('denies a role the frontend has never heard of', () => {
		// A restrictive role added to the backend must not widen access here.
		expect(statusFor(userWith('viewer'), 'users:delete')).toBe(403);
		expect(statusFor(userWith('viewer'), 'dashboard:read')).toBe(403);
	});

	it('answers 401, not 403, without a session', () => {
		// The caller can tell "sign in again" from "this is not for you".
		expect(statusFor(null, 'users:delete')).toBe(401);
		expect(statusFor(null, 'dashboard:read')).toBe(401);
	});

	it('lets a lesser role through what it was granted', () => {
		// A member reaches the dashboard because the grant is written down, not
		// by falling through to some default.
		expect(statusFor(userWith(UserRole.MEMBER), 'dashboard:read')).toBeNull();
		expect(statusFor(userWith('viewer'), 'dashboard:read')).toBe(403);
	});
});

describe('routeAccess', () => {
	// The tables are exhaustive by type; these pin what each kind of entry
	// means to the hook.
	it('gives a page its permission', () => {
		expect(routeAccess('/(app)/admin')).toEqual({
			kind: 'page',
			isPublic: false,
			permission: 'users:read'
		});
	});

	it('lets a public page through with nothing to enforce', () => {
		expect(routeAccess('/(auth)/login')).toEqual({
			kind: 'page',
			isPublic: true,
			permission: null
		});
	});

	it('asks an endpoint only for a session, and leaves the permission to the handler', () => {
		expect(routeAccess('/api/users')).toEqual({
			kind: 'endpoint',
			isPublic: false,
			permission: null
		});
	});

	it("lets the auth flow's own endpoints through without a session", () => {
		expect(routeAccess('/(auth)/refresh')).toMatchObject({ kind: 'endpoint', isPublic: true });
	});

	it('answers null for a route in neither table, which the hook denies', () => {
		expect(routeAccess('/(app)/reports')).toBeNull();
		// Prototype names are not routes.
		expect(routeAccess('constructor')).toBeNull();
	});
});
