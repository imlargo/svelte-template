import { AuthService } from '$lib/features/auth';
import { serverAuthCookies } from '$lib/features/auth/server';
import type { SignInResponse } from '$lib/features/auth/types';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { config } from '$lib/config';

type GoogleOAuthResponse = {
	code: string;
	scope: string;
	authuser: string;
	hd: string;
	prompt: string;
};

function decodeRedirect(value: string | null): string | null {
	if (!value) return null;
	try {
		const decoded = atob(value);
		if (decoded.startsWith('/')) return decoded;
	} catch {
		// ignore malformed base64
	}
	return null;
}

export const load = (async ({ url, cookies }) => {
	const redirectTo = decodeRedirect(url.searchParams.get('redirect'));

	if (serverAuthCookies.isAuthenticated(cookies)) {
		redirect(303, redirectTo ?? config.auth.defaultRedirectPath);
	}

	const credentials = Object.fromEntries(
		new URLSearchParams(url.searchParams.toString())
	) as GoogleOAuthResponse;

	const authService = new AuthService();

	let _authData: null | SignInResponse = null;
	let destination = '/logout';

	try {
		const response = await authService.loginWithGoogle(credentials.code);
		serverAuthCookies.setTokens(cookies, response.tokens.access_token, response.tokens.refresh_token);
		_authData = response;
		destination = redirectTo ?? config.auth.defaultRedirectPath;
	} catch (error) {
		serverAuthCookies.clearTokens(cookies);
		console.error('[auth] Google login failed:', error);
	}

	redirect(303, destination);
}) satisfies PageServerLoad;
