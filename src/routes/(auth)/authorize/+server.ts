// Google OAuth callback: no UI, it only decides where the browser goes next.
import { error, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/app.js';
import { AUTH_ROUTES, HOME_ROUTE } from '#lib/config/routes.js';
import { logger } from '#lib/core/logger.js';
import { AuthService } from '#lib/features/auth/services/auth.js';
import { OAUTH_FAILED_PARAM } from '#lib/features/auth/google.js';
import { sanitizeRedirect } from '#lib/features/auth/redirect.js';
import { clearSession, setSession, takeOAuthState } from '#lib/features/auth/session.server.js';
import type { RequestHandler } from './$types';

const FAILED_SIGN_IN = `${AUTH_ROUTES.login}?${new URLSearchParams({ [OAUTH_FAILED_PARAM]: 'oauth' })}`;

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!config.auth.methods.google.enabled) error(404, 'Google sign-in is not enabled.');

	const stored = takeOAuthState(cookies);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state || !stored || stored.nonce !== state) {
		logger.warn('auth', 'Rejected Google callback: missing or mismatched OAuth state');
		clearSession(cookies);
		redirect(303, FAILED_SIGN_IN);
	}

	try {
		setSession(cookies, await new AuthService().loginWithGoogle(code));
	} catch (err) {
		logger.error('auth', err);
		clearSession(cookies);
		redirect(303, FAILED_SIGN_IN);
	}

	redirect(303, sanitizeRedirect(stored.redirectTo) ?? HOME_ROUTE);
};
