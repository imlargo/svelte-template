/**
 * Auth feature module — public API.
 *
 * Import from here instead of reaching into subfiles directly.
 *
 * @example
 * import { authStore, authCookies, createAuthHandler } from '$lib/features/auth';
 */
export { authStore, AuthStore } from './stores/auth.svelte';
export { authCookies, AuthCookiesManager } from './cookies';
export { createAuthHandler } from './handler';
export { AuthService } from './services/auth';
export type {
	AuthTokens,
	AuthTokensResponse,
	SignInRequest,
	SignInResponse,
	SignUpRequest,
	SignUpResponse,
	ChangePasswordRequest,
	ChangePasswordResponse
} from './types';
