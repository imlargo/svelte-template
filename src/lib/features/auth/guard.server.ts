import { error } from '@sveltejs/kit';
import type { EndpointRouteId, PageRouteId } from '$app/types';
import {
	ENDPOINT_ACCESS,
	PAGE_ACCESS,
	ROLE_PERMISSIONS,
	type Permission
} from '#lib/config/permissions.js';
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

export interface RouteAccess {
	/** Decides how a refusal is answered: a page gets a redirect, an endpoint a status. */
	kind: 'page' | 'endpoint';
	/** Reachable without a session. */
	isPublic: boolean;
	/** What the hook enforces once there is a session. Null for endpoints: the handler asks. */
	permission: Permission | null;
}

/**
 * What a route id takes, from the two tables in `#lib/config/permissions`.
 * Null for a route in neither, which the hook denies: the tables are
 * exhaustive by type, so that is a build that drifted from its routes, never
 * a page someone meant to leave open.
 */
export function routeAccess(routeId: string): RouteAccess | null {
	// `hasOwn`, not `in`: 'constructor' and friends are on every object.
	if (Object.hasOwn(PAGE_ACCESS, routeId)) {
		const access = PAGE_ACCESS[routeId as PageRouteId];
		return {
			kind: 'page',
			isPublic: access === 'public',
			permission: access === 'public' ? null : access
		};
	}

	if (Object.hasOwn(ENDPOINT_ACCESS, routeId)) {
		const access = ENDPOINT_ACCESS[routeId as EndpointRouteId];
		return { kind: 'endpoint', isPublic: access === 'public', permission: null };
	}

	return null;
}
