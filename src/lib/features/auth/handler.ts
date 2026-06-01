/**
 * createAuthHandler — SvelteKit server hook for route-level auth.
 *
 * Moved from src/lib/server/hooks/auth/handler.ts into the auth feature module
 * to keep all auth logic self-contained.
 */
import { redirect, type Handle, type Cookies, type RequestEvent } from '@sveltejs/kit';
import type { AuthCookiesManager } from './cookies';
import type { User } from '$lib/types/auth/user';
import type { AuthTokens } from './types';

export interface AuthHandlerOptions {
	/** Cookie manager instance to use. */
	cookieManager: AuthCookiesManager;
	/** Resolves the user from an access token. Should throw on invalid token. */
	fetchUser: (accessToken: string) => Promise<User>;
	/** Routes accessible without authentication. Default: ['/login', '/authorize', '/logout'] */
	publicRoutes?: string[];
	/**
	 * Override which routes are protected.
	 * - Array: only those paths are protected.
	 * - Function: called with the pathname, return true to protect.
	 * - Default: all routes not in publicRoutes are protected.
	 */
	protectedRoutes?: string[] | ((pathname: string) => boolean);
	/** Path for the login page. Default: '/login' */
	loginPath?: string;
	/** Redirect destination after successful login. Default: '/' */
	defaultRedirectPath?: string;
	/** Paths where the redirect param is NOT appended to the login URL. Default: [defaultRedirectPath] */
	noRedirectPreservation?: string[];
	/** Called on authentication errors (e.g. expired token). */
	onAuthError?: (error: unknown, event: RequestEvent) => void;
	/** Override how auth data is assigned to event.locals. */
	assignLocals?: (event: RequestEvent, user: User, tokens: AuthTokens) => void;
}

export function createAuthHandler(options: AuthHandlerOptions): Handle {
	const {
		cookieManager,
		fetchUser,
		publicRoutes = ['/login', '/authorize', '/logout'],
		protectedRoutes,
		loginPath = '/login',
		defaultRedirectPath = '/',
		noRedirectPreservation,
		onAuthError,
		assignLocals
	} = options;

	const noRedirectSet = new Set(noRedirectPreservation ?? [defaultRedirectPath]);
	const publicSet = new Set(publicRoutes);

	function isProtected(pathname: string): boolean {
		if (publicSet.has(pathname)) return false;
		if (Array.isArray(protectedRoutes)) return protectedRoutes.includes(pathname);
		if (typeof protectedRoutes === 'function') return protectedRoutes(pathname);
		return true;
	}

	function buildLoginUrl(pathname: string, search: string): string {
		const shouldPreserve = !noRedirectSet.has(pathname) || Boolean(search);
		if (!shouldPreserve) return loginPath;
		return `${loginPath}?redirect=${btoa(pathname + search)}`;
	}

	async function redirectToLogin(cookies: Cookies, pathname: string, search: string) {
		cookieManager.clearTokens(cookies);
		return redirect(303, buildLoginUrl(pathname, search));
	}

	function setLocals(event: RequestEvent, user: User, tokens: AuthTokens): void {
		if (assignLocals) {
			assignLocals(event, user, tokens);
			return;
		}
		event.locals.user = user;
		event.locals.accessToken = tokens.accessToken;
		event.locals.refreshToken = tokens.refreshToken;
	}

	return async ({ event, resolve }) => {
		const { pathname, search } = event.url;

		if (!isProtected(pathname)) return resolve(event);

		if (!cookieManager.isAuthenticated(event.cookies)) {
			return redirectToLogin(event.cookies, pathname, search);
		}

		const tokens = cookieManager.getTokens(event.cookies);

		try {
			const user = await fetchUser(tokens.accessToken);
			setLocals(event, user, tokens);
			return resolve(event);
		} catch (error) {
			if (onAuthError) {
				onAuthError(error, event);
			} else {
				console.error('[auth] Failed to authenticate user:', error);
			}
			return redirectToLogin(event.cookies, pathname, search);
		}
	};
}
