/**
 * The auth hook: one pass per request that decides whether it may continue.
 *
 * Order matters — a request is public, or it has a session, or it is sent to
 * the login page; only then is the user resolved and only then is the route
 * permission checked. Authorization lives here and nowhere else: hiding a menu
 * item is presentation, not access control.
 */
import { error, redirect, type Handle } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { AUTH_ROUTE_PERMISSIONS } from '$lib/config/permissions';
import { canAccessRoute } from '$lib/core/permissions';
import { logError } from '$lib/core/logger';
import { AuthService } from './services/auth';
import { encodeRedirect } from './redirect';
import { clearSession, getSession } from './session.server';

function isPublicRoute(pathname: string): boolean {
	return config.auth.publicRoutes.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
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

	if (isPublicRoute(pathname)) return resolve(event);

	const session = getSession(event.cookies);
	if (!session) {
		clearSession(event.cookies);
		redirect(303, loginUrl(pathname, search));
	}

	let user;
	try {
		user = await new AuthService(session.accessToken).getMe();
	} catch (err) {
		logError('auth', err);
		clearSession(event.cookies);
		redirect(303, loginUrl(pathname, search));
	}

	if (!canAccessRoute(AUTH_ROUTE_PERMISSIONS, user.role, pathname)) {
		error(403, 'You do not have access to this page.');
	}

	event.locals.user = user;
	event.locals.accessToken = session.accessToken;

	return resolve(event);
};
