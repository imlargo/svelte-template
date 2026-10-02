import { building } from '$app/environment';
import { env } from '$env/dynamic/public';
import { z } from 'zod';
import { flag, parseEnv, unset } from '$lib/utils/env';
import defaultLogo from '$lib/assets/logo.svg';
import defaultFavicon from '$lib/assets/favicon.svg';

export interface AppConfig {
	api: {
		baseUrl: string;
	};
	auth: {
		/** The auth service's base URL: `PUBLIC_AUTH_BASE_URL`, or the data API when unset. */
		baseUrl: string;
		enabled: boolean;
		methods: {
			password: boolean;
			google: {
				enabled: boolean;
				clientId: string;
			};
		};
		/**
		 * Renew the access token with the refresh token when the backend rejects
		 * it. Off unless the backend implements `POST /auth/refresh` — see
		 * `features/auth/services/auth.ts` for the contract.
		 */
		refresh: {
			enabled: boolean;
		};
	};
	/** Single source of truth for name/logo/favicon/SEO. */
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

const PublicEnvSchema = z
	.object({
		PUBLIC_API_URL: z.url(),
		PUBLIC_AUTH_BASE_URL: z.preprocess(unset, z.url().optional()),
		PUBLIC_AUTH_ENABLED: flag(true),
		PUBLIC_AUTH_PASSWORD_ENABLED: flag(true),
		PUBLIC_AUTH_GOOGLE_ENABLED: flag(false),
		PUBLIC_AUTH_REFRESH_ENABLED: flag(false),
		PUBLIC_GOOGLE_CLIENT_ID: z.preprocess(unset, z.string().default(''))
	})
	.refine((vars) => !vars.PUBLIC_AUTH_GOOGLE_ENABLED || vars.PUBLIC_GOOGLE_CLIENT_ID, {
		message: 'is required when PUBLIC_AUTH_GOOGLE_ENABLED=true',
		path: ['PUBLIC_GOOGLE_CLIENT_ID']
	});

/**
 * `vite build` imports every module to analyse the routes, but the variables
 * belong to the deploy (on Workers they are set on the worker, not on the build
 * machine). So the build gets defaults, and the running app is the one held to
 * account.
 */
const BUILD_ENV = { PUBLIC_API_URL: 'http://build.invalid' };

const publicEnv = parseEnv(PublicEnvSchema, building ? BUILD_ENV : env);

export const config: AppConfig = {
	api: {
		baseUrl: publicEnv.PUBLIC_API_URL
	},
	auth: {
		baseUrl: publicEnv.PUBLIC_AUTH_BASE_URL ?? publicEnv.PUBLIC_API_URL,
		enabled: publicEnv.PUBLIC_AUTH_ENABLED,
		methods: {
			password: publicEnv.PUBLIC_AUTH_PASSWORD_ENABLED,
			google: {
				enabled: publicEnv.PUBLIC_AUTH_GOOGLE_ENABLED,
				clientId: publicEnv.PUBLIC_GOOGLE_CLIENT_ID
			}
		},
		refresh: {
			enabled: publicEnv.PUBLIC_AUTH_REFRESH_ENABLED
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
