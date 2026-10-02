import { error } from '@sveltejs/kit';
import { ROLE_PERMISSIONS, type Permission } from '#lib/config/permissions.js';
import { hasPermission } from '#lib/core/permissions.js';
import type { User } from '#lib/types/user.js';

export type RequirePermission = (permission: Permission) => void;

/**
 * The authorization check behind `locals.requirePermission`, for pages (called
 * by the hook) and endpoints (called by each handler). It throws rather than
 * returning a boolean, so there is no result to forget to act on: 401 without
 * a session, 403 with one that lacks the permission.
 *
 * Takes a getter so the hook can install it before the session resolves.
 * Deliberately ignores `config.auth.enabled`: that switch picks the hook in
 * `hooks.server.ts`, and reading it here would let every authorization test
 * pass vacuously on a machine with auth off.
 */
export function createPermissionGuard(getUser: () => User | null | undefined): RequirePermission {
	return (permission) => {
		const user = getUser();
		if (!user) error(401, 'You need to sign in to access this resource.');
		if (!hasPermission(ROLE_PERMISSIONS, user.role, permission)) {
			error(403, 'You do not have access to this resource.');
		}
	};
}
