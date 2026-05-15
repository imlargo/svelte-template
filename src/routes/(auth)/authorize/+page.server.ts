import { AuthService, authCookies } from '$lib/features/auth';
import type { SignInResponse } from '$lib/features/auth/types';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

type GoogleOAuthResponse = {
	code: string;
	scope: string;
	authuser: string;
	hd: string;
	prompt: string;
};

export const load = (async ({ url, cookies }) => {
	const isAuthenticated = authCookies.isAuthenticated(cookies);
	const redirectParam = url.searchParams.get('redirect');
	let redirectTo: null | string = null;

	if (redirectParam) {
		try {
			redirectTo = atob(redirectParam);
		} catch {
			console.warn('[auth] Failed to decode redirect parameter.');
		}
	}

	if (isAuthenticated) {
		redirect(303, redirectTo || '/');
	}

	const credentials = Object.fromEntries(
		new URLSearchParams(url.searchParams.toString())
	) as GoogleOAuthResponse;

	const authService = new AuthService();

	let _authData: null | SignInResponse = null;
	let destination = '/logout';
	try {
		const response = await authService.loginWithGoogle(credentials.code);
		authCookies.setTokens(cookies, response.tokens.access_token, response.tokens.refresh_token);
		_authData = response;
		destination = redirectTo || '/';
	} catch (error) {
		authCookies.clearTokens(cookies);
		console.error('[auth] Google login failed:', error);
	}

	redirect(303, destination);
}) satisfies PageServerLoad;
