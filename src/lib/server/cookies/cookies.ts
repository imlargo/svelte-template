import type { Cookies } from '@sveltejs/kit';
import type { AuthTokens } from '$lib/features/auth/types';
import { parseAuthCookiesManagerOptions } from './options';
import type { AuthCookiesManagerOptions } from './cookies_options';

/**
 * Manages authentication cookies for access and refresh tokens.
 * Provides methods to set, retrieve, and delete cookies related to authentication.
 *
 * @remarks
 * This class is designed to work with a cookies interface and supports configuration
 * for cookie names, domain, sameSite policy, and max age.
 *
 * @example
 * ```typescript
 * const manager = new AuthCookiesManager(options);
 * manager.login(cookies, accessToken, refreshToken);
 * const tokens = manager.getTokens(cookies);
 * manager.logout(cookies);
 * ```
 */
export class AuthCookiesManager {
	private accessTokenCookieName: string;
	private refreshTokenCookieName: string;
	private domain: string = '';
	private sameSite: 'strict' | 'lax' | 'none' | '';
	private maxAgeSeconds: number;

	constructor(options: AuthCookiesManagerOptions) {
		const parsedOptions = parseAuthCookiesManagerOptions(options);

		this.accessTokenCookieName = parsedOptions.cookies.accessTokenCookieName as string;
		this.refreshTokenCookieName = parsedOptions.cookies.refreshTokenCookieName as string;
		this.maxAgeSeconds = parsedOptions.cookies.maxAgeSeconds as number;
		this.domain = parsedOptions.cookies.domain as string;
		this.sameSite = parsedOptions.cookies.sameSite as 'strict' | 'lax' | 'none' | '';
	}

	getTokens(cookies: Cookies): AuthTokens {
		return {
			accessToken: cookies.get(this.accessTokenCookieName) ?? '',
			refreshToken: cookies.get(this.refreshTokenCookieName) ?? ''
		};
	}

	login(cookies: Cookies, accessToken: string, refreshToken: string): void {
		this.setCookie(cookies, this.accessTokenCookieName, accessToken);
		this.setCookie(cookies, this.refreshTokenCookieName, refreshToken);
	}

	logout(cookies: Cookies): void {
		this.deleteCookie(cookies, this.accessTokenCookieName);
		this.deleteCookie(cookies, this.refreshTokenCookieName);
	}

	isAuthenticated(cookies: Cookies): boolean {
		const accessToken = cookies.get(this.accessTokenCookieName);
		const refreshToken = cookies.get(this.refreshTokenCookieName);
		return isStringPresent(accessToken) && isStringPresent(refreshToken);
	}

	private _useDomain(): boolean {
		return isStringPresent(this.domain);
	}

	private setCookie(cookies: Cookies, cookieName: string, cookieValue: string): void {
		cookies.set(cookieName, cookieValue, {
			maxAge: this.maxAgeSeconds,
			path: '/',
			httpOnly: true,
			secure: true,
			...(this._useDomain() ? { domain: this.domain } : {}),
			...(this.sameSite ? { sameSite: this.sameSite } : {})
		});
	}

	private deleteCookie(cookies: Cookies, cookieName: string): void {
		cookies.delete(cookieName, {
			path: '/',
			...(this._useDomain() ? { domain: this.domain } : {})
		});
	}
}

function isStringPresent(value: string | undefined | null): boolean {
	return value !== undefined && value !== null && value !== '';
}
