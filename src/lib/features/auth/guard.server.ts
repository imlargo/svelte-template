/**
 * The authorization check, injected per request as `locals.requirePermission`.
 *
 * One enforcement point for both halves of the app, reached two ways: the hook
 * calls it for pages, after looking the route up in `AUTH_ROUTE_PERMISSIONS`,
 * and each endpoint handler calls it directly. Endpoints declare their own
 * because they are method-scoped — reading a collection and deleting from it
 * are not the same permission, and a path-keyed table cannot say so.
 *
 * It throws instead of returning a boolean on purpose: an authorization check
 * whose result you can forget to act on is not a check. There is no `can()`
 * alongside it because nothing on the server needs one — the sidebar asks
 * `hasPermission` on the client, with the user from context.
 */
import { error } from '@sveltejs/kit';
import { ROLE_PERMISSIONS, type Permission } from '$lib/config/permissions';
import { hasPermission } from '$lib/core/permissions';
import type { User } from '$lib/types/user';

export type RequirePermission = (permission: Permission) => void;

/**
 * 401 without a session, 403 with one that lacks the permission — the caller
 * can tell "sign in again" from "this is not for you", and so can a fetch().
 *
 * Takes a getter rather than a user so the hook can install it before the
 * session is resolved and never has to replace it. Deliberately does NOT
 * consult `config.auth.enabled`: that switch belongs to `hooks.server.ts`,
 * which picks the hook. Reading it here would make every authorization test
 * pass without asserting anything on a machine whose .env has auth off.
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
