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
 * - **Endpoints** are not. Each handler calls `locals.requirePermission` itself
 *   and this hook does not second-guess it, so who may open a screen and who
 *   may call the endpoint behind it stay separate decisions — and one path can
 *   still ask for `users:read` on GET and `users:delete` on DELETE.
 *
 * What they share is the answer to "who holds this permission"
 * (`ROLE_PERMISSIONS`) and the object that enforces it (`guard.server.ts`).
 * What they do not share is how a route says what it needs, or how a denial
 * comes back: a page gets a redirect or an error page, a fetch gets a status.
 *
 * Form actions ride on a page route, so the page's permission is all they get.
 * A destructive action needs its own `locals.requirePermission` call, exactly
 * like an endpoint.
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
import { isPrefixOf, permissionForRoute } from '$lib/core/permissions';
import { normalizeError } from '$lib/core/errors';
import { logger } from '$lib/core/logger';
import { AuthService } from './services/auth';
import { createPermissionGuard } from './guard.server';
import { encodeRedirect } from './redirect';
import { clearSession, getSession } from './session.server';

function isPublicRoute(pathname: string): boolean {
	return config.auth.publicRoutes.some((prefix) => isPrefixOf(prefix, pathname));
}

/**
 * Endpoints get a status; page requests get sent to the login page. A `fetch()`
 * follows a 303 in silence, receives the login HTML with a 200, and fails on
 * parse — so the user sees a JSON syntax error instead of "your session
 * expired".
 *
 * Not to be confused with SvelteKit's `event.isDataRequest`, which is true for
 * the `__data.json` fetches behind client-side navigation. Those are pages: a
 * redirect is the right answer, and SvelteKit turns it into one the router
 * follows.
 */
function isEndpointRequest(pathname: string): boolean {
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

	// Installed once, reading the user lazily, so there is no window in which
	// `locals` carries a guard bound to the wrong user and nothing to reassign
	// later. Before the session resolves it answers 401, which is correct.
	event.locals.requirePermission = createPermissionGuard(() => event.locals.user);

	// No route matched, so there is nothing to protect and nobody to protect it
	// from. Letting SvelteKit answer its own 404 keeps a mistyped URL from
	// costing a round trip to /auth/me and from being logged as a missing
	// permission — it is a 404, not a 403.
	if (!event.route.id) return resolve(event);

	if (isPublicRoute(pathname)) return resolve(event);

	// Annotated `() => never` so the narrowing survives the call: without it the
	// compiler keeps treating `session` as possibly null after `endSession()`.
	const endSession: () => never = () => {
		clearSession(event.cookies);
		if (isEndpointRequest(pathname)) error(401, 'Your session has expired. Sign in again.');
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

	// Endpoints authorize themselves, per handler and per method. Applying the
	// page table to them is what made every /api/ call 403 before this existed.
	if (!isEndpointRequest(pathname)) {
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
