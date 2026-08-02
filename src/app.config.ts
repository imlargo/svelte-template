import { env } from '$env/dynamic/public';
// Imported from the leaf module, not the `domain` barrel, to keep the icon
// imports in navigation.ts out of every consumer of this config.
import { AUTH_PUBLIC_ROUTE_PREFIXES } from '$lib/config/domain/permissions';

export interface AppConfig {
	api: {
		baseUrl: string;
	};
	auth: {
		baseUrl: string;
		enabled: boolean;
		loginPath: string;
		defaultRedirectPath: string;
		/** Route prefixes reachable without a session. See AUTH_PUBLIC_ROUTE_PREFIXES. */
		publicRoutes: string[];
		methods: {
			password: boolean;
			google: {
				enabled: boolean;
				clientId: string;
			};
		};
	};
}

const config: AppConfig = {
	api: {
		baseUrl: env.PUBLIC_API_URL ?? ''
	},
	auth: {
		baseUrl: env.PUBLIC_AUTH_BASE_URL ?? '',
		enabled: env.PUBLIC_AUTH_ENABLED !== 'false',
		loginPath: '/login',
		defaultRedirectPath: '/',
		publicRoutes: [...AUTH_PUBLIC_ROUTE_PREFIXES],
		methods: {
			password: env.PUBLIC_AUTH_PASSWORD_ENABLED !== 'false',
			google: {
				enabled: env.PUBLIC_AUTH_GOOGLE_ENABLED === 'true',
				clientId: env.PUBLIC_GOOGLE_CLIENT_ID ?? ''
			}
		}
	}
};

export default config;
