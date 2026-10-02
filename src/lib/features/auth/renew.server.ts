import type { Cookies } from '@sveltejs/kit';
import { AuthService } from './services/auth';
import { setSession, type Session } from './session.server';

/**
 * Spends the refresh token and rotates both cookies. Used by the hook before a
 * page loads and by `/refresh` between navigations. Throws what the backend
 * throws; see `isCredentialRejection` for which failures end the session.
 */
export async function renewSession(cookies: Cookies, refreshToken: string): Promise<Session> {
	const tokens = await new AuthService().refresh(refreshToken);
	const session = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };

	setSession(cookies, session);
	return session;
}
