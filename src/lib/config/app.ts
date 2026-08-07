import { env } from '$env/dynamic/public';
import { AUTH_PUBLIC_ROUTE_PREFIXES } from '$lib/config/permissions';
import defaultLogo from '$lib/assets/logo.svg';
import defaultFavicon from '$lib/assets/favicon.svg';

export interface AppConfig {
	api: {
		baseUrl: string;
	};
	auth: {
		/** Base URL when auth lives on its own host. Empty falls back to the data API. */
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
	/** Single source of truth for name/logo/favicon/SEO. See docs/ARCHITECTURE.md §17. */
	branding: {
		name: string;
		logo: string;
		favicon: string;
		seo: {
			title: string;
			description: string;
		};
	};
}

export const config: AppConfig = {
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
	},
	// Hardcoded, not env-driven: this changes once per project, not once per deploy environment.
	branding: {
		name: 'App',
		logo: defaultLogo,
		favicon: defaultFavicon,
		seo: {
			title: 'App',
			description: ''
		}
	}
};
