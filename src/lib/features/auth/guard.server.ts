import { error } from '@sveltejs/kit';
import { ROLE_PERMISSIONS, type Permission } from '#lib/config/permissions.js';
import { hasPermission } from '#lib/core/permissions.js';
import type { User } from '#lib/types/user.js';

/** Returns the user it let through, so a handler can record who acted. */
export type RequirePermission = (permission: Permission) => User;

/**
 * The check behind `locals.requirePermission`. Throws instead of returning a
 * boolean, so there is no result to forget: 401 without a session, 403 without
 * the permission. Takes a getter so the hook can install it before the session
 * resolves. Ignores `config.auth.enabled` on purpose: that switch picks the
 * hook, and reading it here would make every authorization test pass with
 * auth off.
 */
export function createPermissionGuard(getUser: () => User | null | undefined): RequirePermission {
	return (permission) => {
		const user = getUser();
		if (!user) error(401, 'You need to sign in to access this resource.');
		if (!hasPermission(ROLE_PERMISSIONS, user.role, permission)) {
			error(403, 'You do not have access to this resource.');
		}
		return user;
	};
}
