/**
 * Google OAuth callback. An endpoint, not a page: it has no UI, it only decides
 * where the browser goes next.
 */
import { error, redirect } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { logger } from '$lib/core/logger';
import { AuthService } from '$lib/features/auth/services/auth';
import { decodeRedirect } from '$lib/features/auth/redirect';
import { clearSession, setSession, takeOAuthState } from '$lib/features/auth/session.server';
import type { RequestHandler } from './$types';

const FAILED_SIGN_IN = `${config.auth.loginPath}?error=oauth`;

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!config.auth.methods.google.enabled) error(404, 'Google sign-in is not enabled.');

	// Consumed even on the failure paths below: the nonce is good for one callback.
	const stored = takeOAuthState(cookies);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state || !stored || stored.nonce !== state) {
		logger.error('auth', new Error('Rejected Google callback: missing or mismatched OAuth state'));
		clearSession(cookies);
		redirect(303, FAILED_SIGN_IN);
	}

	try {
		const { tokens } = await new AuthService().loginWithGoogle(code);
		setSession(cookies, {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token
		});
	} catch (err) {
		logger.error('auth', err);
		clearSession(cookies);
		redirect(303, FAILED_SIGN_IN);
	}

	redirect(303, decodeRedirect(stored.redirectTo) ?? config.auth.defaultRedirectPath);
};
