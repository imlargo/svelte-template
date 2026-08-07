import { config } from '$lib/config/app';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

/** Google requires an exact match with the URI registered in the console. */
export const GOOGLE_CALLBACK_PATH = '/authorize';

/**
 * `state` is echoed back by Google to the callback, where it is compared with
 * the nonce stored in a cookie. Without it, an attacker can hand a victim a
 * ready-made callback URL and sign them into the attacker's account.
 */
export function buildGoogleAuthUrl(origin: string, state: string): string {
	const params = new URLSearchParams({
		client_id: config.auth.methods.google.clientId,
		redirect_uri: `${origin}${GOOGLE_CALLBACK_PATH}`,
		response_type: 'code',
		prompt: 'select_account',
		scope: 'openid profile email',
		include_granted_scopes: 'true',
		state
	});

	return `${GOOGLE_AUTH_ENDPOINT}?${params}`;
}
