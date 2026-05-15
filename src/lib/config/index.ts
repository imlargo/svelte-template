/**
 * Application configuration system.
 *
 * Inspired by Nuxt's runtime config:
 *  - Typed, modular, extensible
 *  - Smart defaults — works out of the box without any .env
 *  - Clearly separates public (client-accessible) from private (server-only) config
 *  - Single call to `defineConfig()` from `src/app.config.ts` sets up everything
 *
 * Usage:
 *   // src/app.config.ts
 *   import { defineConfig } from '$lib/config';
 *   export default defineConfig({ api: { baseUrl: 'https://api.example.com' } });
 *
 *   // Anywhere
 *   import { getConfig } from '$lib/config';
 *   const { api, auth } = getConfig();
 */

// ─── Public config (safe to expose to the client) ────────────────────────────

export interface PublicApiConfig {
	/** Base URL for all API requests. Defaults to '' (same origin). */
	baseUrl: string;
}

export interface PublicAuthConfig {
	/** Whether the auth module is active. Set to false to disable auth entirely. */
	enabled: boolean;
	/** Google OAuth client ID. Required only when using Google login. */
	googleClientId: string;
	/** Path for the login page. */
	loginPath: string;
	/** Default redirect path after successful login. */
	defaultRedirectPath: string;
	/** Routes that are publicly accessible without authentication. */
	publicRoutes: string[];
}

export interface PublicConfig {
	api: PublicApiConfig;
	auth: PublicAuthConfig;
}

// ─── Full config (server-side can access everything) ─────────────────────────

export interface AppConfig extends PublicConfig {
	// Add server-only (private) config fields here in the future.
	// Example:
	//   database: { url: string; poolSize: number };
	//   smtp: { host: string; port: number; user: string; password: string };
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

function buildDefaults(): AppConfig {
	return {
		api: {
			baseUrl: ''
		},
		auth: {
			enabled: true,
			googleClientId: '',
			loginPath: '/login',
			defaultRedirectPath: '/',
			publicRoutes: ['/login', '/authorize', '/logout']
		}
	};
}

// ─── Deep merge helper ────────────────────────────────────────────────────────

type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function deepMerge<T extends object>(base: T, overrides: DeepPartial<T>): T {
	const result = { ...base } as T;
	for (const key in overrides) {
		const override = overrides[key as keyof typeof overrides];
		if (override !== undefined) {
			const baseValue = base[key as keyof T];
			if (
				typeof override === 'object' &&
				override !== null &&
				!Array.isArray(override) &&
				typeof baseValue === 'object' &&
				baseValue !== null
			) {
				result[key as keyof T] = deepMerge(baseValue as object, override as object) as T[keyof T];
			} else {
				result[key as keyof T] = override as T[keyof T];
			}
		}
	}
	return result;
}

// ─── Config registry ─────────────────────────────────────────────────────────

let _config: AppConfig | null = null;

/**
 * Define and register the application configuration.
 * Call this once from `src/app.config.ts`.
 *
 * @example
 * import { defineConfig } from '$lib/config';
 * export default defineConfig({
 *   api: { baseUrl: 'https://api.example.com' },
 *   auth: { googleClientId: 'your-client-id' }
 * });
 */
export function defineConfig(overrides: DeepPartial<AppConfig> = {}): AppConfig {
	_config = deepMerge(buildDefaults(), overrides);
	return _config;
}

/**
 * Access the current application configuration.
 * If `defineConfig()` was never called, returns the default config.
 */
export function getConfig(): AppConfig {
	if (!_config) {
		_config = buildDefaults();
	}
	return _config;
}

/**
 * Access only the public (client-safe) portion of the config.
 */
export function getPublicConfig(): PublicConfig {
	const config = getConfig();
	return {
		api: config.api,
		auth: config.auth
	};
}
