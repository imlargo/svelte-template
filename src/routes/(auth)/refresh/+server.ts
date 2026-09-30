/**
 * Renews the session for the browser. The client-side API transport calls this
 * when a request comes back 401 (`features/auth/client-session.svelte.ts`):
 * the refresh token is httpOnly, so only the server can spend it.
 *
 * Public in the hook's eyes because it authenticates itself — the expired
 * access token it exists to replace is exactly what the hook would reject.
 */
import { error, json } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { normalizeError } from '$lib/core/errors';
import { logger } from '$lib/core/logger';
import { renewSession } from '$lib/features/auth/renew.server';
import { clearSession, getSession } from '$lib/features/auth/session.server';
import type { RefreshedSession } from '$lib/features/auth/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	if (!config.auth.refresh.enabled) error(404, 'Session refresh is not enabled.');

	const session = getSession(cookies);
	if (!session) error(401, 'Your session has expired. Sign in again.');

	let renewed;
	try {
		renewed = await renewSession(cookies, session.refreshToken);
	} catch (err) {
		// Same rule as the hook: only a rejected refresh token ends the session.
		const { code } = normalizeError(err);
		if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
			clearSession(cookies);
			error(401, 'Your session has expired. Sign in again.');
		}
		logger.error('auth', err);
		error(503, 'Cannot renew your session right now. Please try again in a moment.');
	}

	return json({ accessToken: renewed.accessToken } satisfies RefreshedSession);
};
