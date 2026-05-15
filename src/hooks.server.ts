import type { Handle } from '@sveltejs/kit';
import { getConfig } from '$lib/config';
import { authCookies, AuthService, createAuthHandler } from '$lib/features/auth';

// Import app.config.ts first so defineConfig() runs and sets the config
// before getConfig() is called below.
import './app.config';

// Build the handler once at server startup — not on every request.
const config = getConfig();

export const handle: Handle = config.auth.enabled
	? createAuthHandler({
			cookieManager: authCookies,

			fetchUser: (accessToken) => new AuthService(accessToken).getMe(),

			publicRoutes: config.auth.publicRoutes,
			loginPath: config.auth.loginPath,
			defaultRedirectPath: config.auth.defaultRedirectPath,

			onAuthError: (error) => {
				console.error('[auth] Failed to authenticate user:', error);
			}
		})
	: ({ event, resolve }) => resolve(event);
