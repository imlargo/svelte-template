/**
 * AuthCookiesManager — manages HTTP-only auth cookies.
 *
 * Consolidated from the previous 4-file split (cookies_options, options,
 * cookies, manager). All defaults live here; nothing is split across files.
 */
import type { Cookies } from '@sveltejs/kit';
import type { AuthTokens } from './types';

export interface AuthCookiesOptions {
	accessTokenName?: string;
	refreshTokenName?: string;
	domain?: string;
	secure?: boolean;
	maxAgeSeconds?: number;
	sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULTS = {
	accessTokenName: 'access_token',
	refreshTokenName: 'refresh_token',
	secure: true,
	maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
	sameSite: 'lax' as const,
	domain: ''
};

export class AuthCookiesManager {
	private readonly atName: string;
	private readonly rtName: string;
	private readonly domain: string;
	private readonly secure: boolean;
	private readonly sameSite: 'strict' | 'lax' | 'none';
	private readonly maxAge: number;

	constructor(options: AuthCookiesOptions = {}) {
		this.atName = options.accessTokenName ?? DEFAULTS.accessTokenName;
		this.rtName = options.refreshTokenName ?? DEFAULTS.refreshTokenName;
		this.domain = options.domain ?? DEFAULTS.domain;
		this.secure = options.secure ?? DEFAULTS.secure;
		this.sameSite = options.sameSite ?? DEFAULTS.sameSite;
		this.maxAge = options.maxAgeSeconds ?? DEFAULTS.maxAgeSeconds;
	}

	getTokens(cookies: Cookies): AuthTokens {
		return {
			accessToken: cookies.get(this.atName) ?? '',
			refreshToken: cookies.get(this.rtName) ?? ''
		};
	}

	setTokens(cookies: Cookies, accessToken: string, refreshToken: string): void {
		this.set(cookies, this.atName, accessToken);
		this.set(cookies, this.rtName, refreshToken);
	}

	clearTokens(cookies: Cookies): void {
		this.delete(cookies, this.atName);
		this.delete(cookies, this.rtName);
	}

	isAuthenticated(cookies: Cookies): boolean {
		const at = cookies.get(this.atName);
		const rt = cookies.get(this.rtName);
		return !!at && !!rt;
	}

	private set(cookies: Cookies, name: string, value: string): void {
		cookies.set(name, value, {
			path: '/',
			httpOnly: true,
			secure: this.secure,
			maxAge: this.maxAge,
			sameSite: this.sameSite,
			...(this.domain ? { domain: this.domain } : {})
		});
	}

	private delete(cookies: Cookies, name: string): void {
		cookies.delete(name, {
			path: '/',
			...(this.domain ? { domain: this.domain } : {})
		});
	}
}

/** Shared singleton with default settings. Override via constructor if needed. */
export const authCookies = new AuthCookiesManager();
