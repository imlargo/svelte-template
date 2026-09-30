import { building } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { Pathname } from '$app/types';
import { z } from 'zod';
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
		loginPath: Pathname;
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

// An empty value in .env (`PUBLIC_AUTH_BASE_URL=`) means "not set", not "set to
// nothing": it falls through to the default instead of failing validation.
const unset = (value: unknown) => (value === '' ? undefined : value);

const flag = (fallback: boolean) => z.preprocess(unset, z.stringbool().default(fallback));

/**
 * Validated once, when this module loads. A missing or malformed variable
 * fails here, naming the variable, instead of surfacing later as requests to a
 * relative URL or a Google button that cannot sign anyone in.
 */
const PublicEnvSchema = z
	.object({
		PUBLIC_API_URL: z.url(),
		PUBLIC_AUTH_BASE_URL: z.preprocess(unset, z.url().default('')),
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
 * `vite build` imports every module to analyse the routes, and the env it
 * would check belongs to the deploy, which does not exist yet: on Workers the
 * variables are set on the worker, not on the build machine. So the build gets
 * defaults, and the running app — the one that would misbehave — is the one
 * held to account.
 */
const BUILD_ENV = { PUBLIC_API_URL: 'http://build.invalid' };

function parsePublicEnv() {
	if (building) return PublicEnvSchema.parse(BUILD_ENV);

	const parsed = PublicEnvSchema.safeParse(env);
	if (parsed.success) return parsed.data;

	const problems = parsed.error.issues.map(
		(issue) => `  ${issue.path.join('.')}: ${issue.message}`
	);
	throw new Error(`Invalid environment variables (see .env.example):\n${problems.join('\n')}`);
}

const publicEnv = parsePublicEnv();

export const config: AppConfig = {
	api: {
		baseUrl: publicEnv.PUBLIC_API_URL
	},
	auth: {
		baseUrl: publicEnv.PUBLIC_AUTH_BASE_URL,
		enabled: publicEnv.PUBLIC_AUTH_ENABLED,
		loginPath: '/login',
		defaultRedirectPath: '/',
		publicRoutes: [...AUTH_PUBLIC_ROUTE_PREFIXES],
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
