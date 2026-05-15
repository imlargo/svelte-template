import type { Handle } from '@sveltejs/kit';
import { config } from '$lib/config';
import { authCookies, AuthService, createAuthHandler } from '$lib/features/auth';

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
