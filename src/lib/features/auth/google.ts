import { config } from '#lib/config/app.js';
import { AUTH_ROUTES } from '#lib/config/routes.js';

/** Listed on the login redirect: SvelteKit refuses external targets otherwise. */
export const GOOGLE_AUTH_ORIGIN = 'https://accounts.google.com';

const GOOGLE_AUTH_ENDPOINT = `${GOOGLE_AUTH_ORIGIN}/o/oauth2/v2/auth`;

/** `state` comes back to the callback and is compared with the nonce cookie: login CSRF. */
export function buildGoogleAuthUrl(origin: string, state: string): string {
	const params = new URLSearchParams({
		client_id: config.auth.methods.google.clientId,
		redirect_uri: `${origin}${AUTH_ROUTES.authorize}`,
		response_type: 'code',
		prompt: 'select_account',
		scope: 'openid profile email',
		include_granted_scopes: 'true',
		state
	});

	return `${GOOGLE_AUTH_ENDPOINT}?${params}`;
}
