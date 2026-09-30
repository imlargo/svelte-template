/**
 * Renews the session with the refresh token. Shared by the auth hook, which
 * renews before a page load when the access token has expired, and by the
 * `/refresh` route, which the browser calls when an API request comes back 401.
 *
 * Throws what the backend throws: an `UNAUTHORIZED` means the refresh token is
 * dead too and the session is over; anything else is an outage, and callers
 * must not sign the user out over it.
 */
import type { Cookies } from '@sveltejs/kit';
import { AuthService } from './services/auth';
import { setSession, type Session } from './session.server';

export async function renewSession(cookies: Cookies, refreshToken: string): Promise<Session> {
	const tokens = await new AuthService().refresh(refreshToken);
	const session = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };

	setSession(cookies, session);
	return session;
}
