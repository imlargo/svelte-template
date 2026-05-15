import type { Handle } from '@sveltejs/kit';
import { getConfig } from '$lib/config';
import { authCookies, AuthService, createAuthHandler } from '$lib/features/auth';

// Import app.config.ts first so defineConfig() runs and sets the config
// before getConfig() is called inside the handler below.
import './app.config';

export const handle: Handle = async ({ event, resolve }) => {
	const config = getConfig();

	if (!config.auth.enabled) {
		return resolve(event);
	}

	return createAuthHandler({
		cookieManager: authCookies,

		fetchUser: async (accessToken) => {
			const service = new AuthService(accessToken);
			return service.getMe();
		},

		publicRoutes: config.auth.publicRoutes,
		loginPath: config.auth.loginPath,
		defaultRedirectPath: config.auth.defaultRedirectPath,

		onAuthError: (error) => {
			console.error('[auth] Failed to authenticate user:', error);
		}
	})({ event, resolve });
};
