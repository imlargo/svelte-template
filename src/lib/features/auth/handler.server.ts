/**
 * The auth hook. Authentication is central: every non-public route needs a
 * session before anything else runs. Authorization is split: a page's
 * permission is enforced here from `ROUTE_ACCESS`, an endpoint asks for its
 * own per method with `locals.requirePermission`. The token is never
 * inspected: the backend that issued it is asked who it belongs to.
 */
import { error, redirect, type Cookies } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import type { RouteId } from '$app/types';
import { config } from '#lib/config/app.js';
import { ROUTE_ACCESS } from '#lib/config/permissions.js';
import { AUTH_ROUTES, HOME_ROUTE } from '#lib/config/routes.js';
import { normalizeError } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';
import type { User } from '#lib/types/user.js';
import type { Session } from '#lib/features/auth/types.js';
import { AuthService } from './services/auth';
import { createPermissionGuard } from './guard.server';
import { REDIRECT_PARAM, encodeRedirect } from './redirect';
import { isCredentialRejection } from './rejection';
import { renewSession } from './renew.server';
import { clearSession, getSession } from './session.server';

function loginUrl(pathname: string, search: string): string {
	if (pathname === HOME_ROUTE && !search) return AUTH_ROUTES.login;
	const params = new URLSearchParams({ [REDIRECT_PARAM]: encodeRedirect(pathname + search) });
	return `${AUTH_ROUTES.login}?${params}`;
}

/** Resolves the user, renewing the session once if the access token was rejected and refresh is on. */
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

	// Reads the user lazily, so it is never bound to the wrong one.
	event.locals.requirePermission = createPermissionGuard(() => event.locals.user);

	// No route matched: SvelteKit answers the 404 without a trip to the backend.
	const routeId = event.route.id;
	if (!routeId) return resolve(event);

	// `hasOwn`, not `in`: 'constructor' and friends are on every object.
	const access = Object.hasOwn(ROUTE_ACCESS, routeId) ? ROUTE_ACCESS[routeId as RouteId] : null;
	if (!access) {
		// The table is exhaustive by type, so this is a build that drifted from its routes.
		logger.warn('auth', 'Undeclared route', { routeId });
		error(403, 'You do not have access to this page.');
	}

	if (access === 'public') return resolve(event);

	const endSession: () => never = () => {
		clearSession(event.cookies);
		// A `fetch()` follows a 303 in silence and then fails parsing the login HTML.
		if (access === 'session') error(401, 'Your session has expired. Sign in again.');
		redirect(303, loginUrl(pathname, search));
	};

	const stored = getSession(event.cookies);
	if (!stored) endSession();

	let user: User;
	let session: Session;
	try {
		({ user, session } = await resolveSession(event.cookies, stored));
	} catch (err) {
		// An outage must not sign everyone out.
		if (!isCredentialRejection(err)) {
			logger.error('auth', err);
			error(503, 'Cannot verify your session right now. Please try again in a moment.');
		}
		endSession();
	}

	event.locals.user = user;
	event.locals.accessToken = session.accessToken;

	if (access !== 'session') event.locals.requirePermission(access);

	return resolve(event);
};
