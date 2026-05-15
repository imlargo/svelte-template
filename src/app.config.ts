/**
 * App configuration — edit this file to customize your project.
 *
 * Env vars are read from $env/dynamic/public (safe on client + server).
 * For server-only secrets use $env/dynamic/private in hooks.server.ts.
 */
import { env } from '$env/dynamic/public';

const config = {
	api: {
		/** Base URL for all API requests. Defaults to '' (same origin). */
		baseUrl: env.PUBLIC_BACKEND_BASE_URL || ''
	},
	auth: {
		/** Set to false to disable authentication entirely. */
		enabled: true,
		/** Google OAuth client ID. Only required when using Google login. */
		googleClientId: env.PUBLIC_GOOGLE_CLIENT_ID || '',
		loginPath: '/login',
		defaultRedirectPath: '/',
		publicRoutes: ['/login', '/authorize', '/logout']
	}
};

export default config;
export type AppConfig = typeof config;
