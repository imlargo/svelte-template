/**
 * The auth hook: one pass per request that decides whether it may continue.
 *
 * Authentication is central: a route that forgets to ask must not open.
 * Authorization is split, because pages and endpoints are different shapes:
 *
 * - **Pages** are declared in `AUTH_ROUTE_PERMISSIONS` and enforced here,
 *   before any load runs. Undeclared means denied.
 * - **Endpoints** call `locals.requirePermission` themselves, per method, so
 *   one path can ask for `users:read` on GET and `users:delete` on DELETE.
 *
 * Form actions ride on their page's permission; a destructive one needs its
 * own `locals.requirePermission` call, exactly like an endpoint.
 *
 * The token is never inspected here: the backend that issued it is the
 * authority, and asking it (`/auth/me`) also yields the user's current role.
 */
import { error, redirect, type Cookies } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { config } from '#lib/config/app.js';
import { AUTH_ROUTE_PERMISSIONS, PUBLIC_ROUTE_PREFIXES } from '#lib/config/permissions.js';
import { API_ROUTE_PREFIX, AUTH_ROUTES, HOME_ROUTE } from '#lib/config/routes.js';
import { isPrefixOf, permissionForRoute } from '#lib/core/permissions.js';
import { normalizeError } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';
import type { User } from '#lib/types/user.js';
import { AuthService } from './services/auth';
import { createPermissionGuard } from './guard.server';
import { REDIRECT_PARAM, encodeRedirect } from './redirect';
import { isCredentialRejection } from './rejection';
import { renewSession } from './renew.server';
import { clearSession, getSession, type Session } from './session.server';

function isPublicRoute(pathname: string): boolean {
	return PUBLIC_ROUTE_PREFIXES.some((prefix) => isPrefixOf(prefix, pathname));
}

/**
 * Endpoints get a status, pages a redirect: a `fetch()` follows a 303 in
 * silence and then fails parsing the login HTML. Not SvelteKit's
 * `isDataRequest`, which marks client-side navigations — those are pages.
 */
function isEndpointRequest(pathname: string): boolean {
	return isPrefixOf(API_ROUTE_PREFIX, pathname);
}

function loginUrl(pathname: string, search: string): string {
	// Landing on home carries nothing worth coming back to.
	if (pathname === HOME_ROUTE && !search) return AUTH_ROUTES.login;
	const params = new URLSearchParams({ [REDIRECT_PARAM]: encodeRedirect(pathname + search) });
	return `${AUTH_ROUTES.login}?${params}`;
}

/**
 * Asks the backend who the session belongs to, renewing it once first if the
 * access token was rejected and refresh is on. Returns the session actually
 * used, which is the renewed one after a renewal.
 */
async function resolveSession(
	cookies: Cookies,
	session: Session
): Promise<{ user: User; session: Session }> {
	try {
		return { user: await new AuthService({ token: session.accessToken }).getMe(), session };
	} catch (err) {
		if (!config.auth.refresh.enabled || normalizeError(err).code !== 'UNAUTHORIZED') throw err;
	}

	const renewed = await renewSession(cookies, session.refreshToken);
	return { user: await new AuthService({ token: renewed.accessToken }).getMe(), session: renewed };
}

export const handleAuth: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	// Installed before the session resolves and reading the user lazily, so it
	// is never bound to the wrong user. Until then it answers 401.
	event.locals.requirePermission = createPermissionGuard(() => event.locals.user);

	// No route matched: let SvelteKit answer its 404 without a trip to /auth/me.
	if (!event.route.id) return resolve(event);

	if (isPublicRoute(pathname)) return resolve(event);

	// `() => never` keeps `stored` narrowed to non-null after the call.
	const endSession: () => never = () => {
		clearSession(event.cookies);
		if (isEndpointRequest(pathname)) error(401, 'Your session has expired. Sign in again.');
		redirect(303, loginUrl(pathname, search));
	};

	const stored = getSession(event.cookies);
	if (!stored) endSession();

	let user: User;
	let session: Session;
	try {
		({ user, session } = await resolveSession(event.cookies, stored));
	} catch (err) {
		// A backend that is down must not sign everyone out.
		if (!isCredentialRejection(err)) {
			logger.error('auth', err);
			error(503, 'Cannot verify your session right now. Please try again in a moment.');
		}
		endSession();
	}

	event.locals.user = user;
	event.locals.accessToken = session.accessToken;

	if (!isEndpointRequest(pathname)) {
		const required = permissionForRoute(AUTH_ROUTE_PERMISSIONS, pathname);
		if (!required) {
			// A developer's omission, not the user's: log it, answer like any refusal.
			logger.warn('auth', 'Undeclared page route', { pathname });
			error(403, 'You do not have access to this page.');
		}
		event.locals.requirePermission(required);
	}

	return resolve(event);
};
