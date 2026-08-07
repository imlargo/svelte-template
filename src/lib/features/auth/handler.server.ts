/**
 * The auth hook: one pass per request that decides whether it may continue.
 *
 * Authentication is central — a request either carries a valid session or it
 * does not, and a route that forgets to ask must not be a route that opens.
 *
 * Authorization is split on purpose, because the two halves of a full-stack app
 * are not the same shape:
 *
 * - **Pages** are a tree the user navigates. They are declared as a tree
 *   (`AUTH_ROUTE_PERMISSIONS`) and enforced here, once, before any load runs.
 *   Undeclared means denied, so a new page cannot ship open by omission.
 * - **Endpoints** are not. One path answers to several methods that may need
 *   different permissions, which a path-keyed table cannot express — so each
 *   handler calls `locals.requirePermission` itself, and this hook does not
 *   second-guess it.
 *
 * What they share is the answer to "who holds this permission"
 * (`PERMISSION_GROUPS`) and the object that enforces it (`guard.server.ts`).
 * What they do not share is how a route says what it needs, or how a denial
 * comes back: a page gets a redirect or an error page, a fetch gets a status.
 *
 * The token itself is never inspected here. The backend that issued it is the
 * authority on whether it is still valid, and asking it (`/auth/me`) is both
 * the check and the way we learn the user's current role. Verifying a JWT
 * locally would need its signing key and would still trust a role snapshot
 * frozen at issue time.
 */
import { error, redirect, type Handle } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { AUTH_ROUTE_PERMISSIONS } from '$lib/config/permissions';
import { permissionForRoute } from '$lib/core/permissions';
import { normalizeError } from '$lib/core/errors';
import { logger } from '$lib/core/logger';
import { AuthService } from './services/auth';
import { createPermissionGuard } from './guard.server';
import { encodeRedirect } from './redirect';
import { clearSession, getSession } from './session.server';

function isPublicRoute(pathname: string): boolean {
	return config.auth.publicRoutes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

/**
 * Data requests get a status; page requests get sent to the login page. A
 * `fetch()` follows a 303 in silence, receives the login HTML with a 200, and
 * fails on parse — so the user sees a JSON syntax error instead of "your
 * session expired".
 */
function isDataRequest(pathname: string): boolean {
	return pathname.startsWith('/api/');
}

function loginUrl(pathname: string, search: string): string {
	// Landing on the default route carries nothing worth coming back to.
	if (pathname === config.auth.defaultRedirectPath && !search) return config.auth.loginPath;
	// Escaped because base64 uses '+' and '=', which are not query-string safe.
	const target = encodeURIComponent(encodeRedirect(pathname + search));
	return `${config.auth.loginPath}?redirect=${target}`;
}

export const handleAuth: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	// Installed up front so the type on `locals` holds everywhere, including on
	// public routes: with no session, every permission check answers 401.
	event.locals.requirePermission = createPermissionGuard(null);

	if (isPublicRoute(pathname)) return resolve(event);

	// Annotated `() => never` so the narrowing survives the call: without it the
	// compiler keeps treating `session` as possibly null after `endSession()`.
	const endSession: () => never = () => {
		clearSession(event.cookies);
		if (isDataRequest(pathname)) error(401, 'Your session has expired. Sign in again.');
		redirect(303, loginUrl(pathname, search));
	};

	const session = getSession(event.cookies);
	if (!session) endSession();

	let user;
	try {
		user = await new AuthService(session.accessToken).getMe();
	} catch (err) {
		// Only a rejected token ends the session. A backend that is down or
		// erroring must not sign everyone out: that turns an outage into a
		// stampede of logins and throws away whatever the user was doing.
		const failure = normalizeError(err);
		if (!failure.is('UNAUTHORIZED') && !failure.is('FORBIDDEN')) {
			logger.error('auth', err);
			error(503, 'Cannot verify your session right now. Please try again in a moment.');
		}
		endSession();
	}

	event.locals.user = user;
	event.locals.accessToken = session.accessToken;
	event.locals.requirePermission = createPermissionGuard(user);

	// Endpoints authorize themselves, per handler and per method. Applying the
	// page table to them is what made every /api/ call 403 before this existed.
	if (!isDataRequest(pathname)) {
		const required = permissionForRoute(AUTH_ROUTE_PERMISSIONS, pathname);
		if (!required) {
			// Not a user problem: the page exists but nobody declared it. Say so in
			// the log, and give the visitor the same 403 as any other refusal.
			logger.error('auth', new Error(`Undeclared page route: ${pathname}`));
			error(403, 'You do not have access to this page.');
		}
		event.locals.requirePermission(required);
	}

	return resolve(event);
};
