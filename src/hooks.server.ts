import type { Handle, HandleServerError } from '@sveltejs/kit';
import { config } from '$lib/config';
import { authCookies, AuthService, createAuthHandler } from '$lib/features/auth';
import { normalizeError } from '$lib/core/errors';

export const handle: Handle = config.auth.enabled
	? createAuthHandler({
			cookieManager: authCookies,

			fetchUser: (accessToken) => new AuthService(accessToken).getMe(),

			publicRoutes: config.auth.publicRoutes,
			loginPath: config.auth.loginPath,
			defaultRedirectPath: config.auth.defaultRedirectPath,

			onAuthError: (error) => {
				console.error('[auth]', normalizeError(error).getMessage());
			}
		})
	: ({ event, resolve }) => resolve(event);

export const handleError: HandleServerError = ({ error, status }) => {
	const err = normalizeError(error);
	if (status !== 404) console.error('[server error]', err);
	return { message: err.getMessage() };
};
