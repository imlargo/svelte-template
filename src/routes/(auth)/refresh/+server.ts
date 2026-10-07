/**
 * Renews the session for the browser when an API call comes back 401
 * (`features/auth/client-session.svelte.ts`): the refresh token is httpOnly,
 * so only the server can spend it. Public to the hook because it
 * authenticates itself with that cookie.
 */
import { error } from '@sveltejs/kit';
import { config } from '#lib/config/app.js';
import { logger } from '#lib/core/logger.js';
import { isCredentialRejection } from '#lib/features/auth/rejection.js';
import { renewSession } from '#lib/features/auth/renew.server.js';
import { clearSession, getSession } from '#lib/features/auth/session.server.js';
import type { RefreshedSession, Session } from '#lib/features/auth/types.js';
import type { RequestHandler } from './$types';

const SESSION_EXPIRED = 'Your session has expired. Sign in again.';

export const POST: RequestHandler = async ({ cookies }) => {
	if (!config.auth.refresh.enabled) error(404, 'Session refresh is not enabled.');

	const session = getSession(cookies);
	if (!session) error(401, SESSION_EXPIRED);

	let renewed: Session;
	try {
		renewed = await renewSession(cookies, session.refreshToken);
	} catch (err) {
		if (isCredentialRejection(err)) {
			clearSession(cookies);
			error(401, SESSION_EXPIRED);
		}
		logger.error('auth', err);
		error(503, 'Cannot renew your session right now. Please try again in a moment.');
	}

	return Response.json({ accessToken: renewed.accessToken } satisfies RefreshedSession);
};
