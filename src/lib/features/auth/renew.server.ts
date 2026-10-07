import type { Cookies } from '@sveltejs/kit';
import type { Session } from '#lib/features/auth/types.js';
import { AuthService } from './services/auth';
import { setSession } from './session.server';

/**
 * Spends the refresh token and rotates both cookies. Used by the hook before a
 * page loads and by `/refresh` between navigations. Throws what the backend
 * throws; see `isCredentialRejection` for which failures end the session.
 */
export async function renewSession(cookies: Cookies, refreshToken: string): Promise<Session> {
	const session = await new AuthService().refresh(refreshToken);
	setSession(cookies, session);
	return session;
}
