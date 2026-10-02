/**
 * The session cookies, and the only place that knows their names and options.
 *
 * The cookie lifetime is not the token lifetime: the backend decides when an
 * access token expires, and the hook finds out on the next `/auth/me`.
 */
import {
	AUTH_COOKIE_DOMAIN,
	AUTH_COOKIE_MAX_AGE,
	AUTH_COOKIE_SAMESITE,
	AUTH_COOKIE_SECURE
} from '$app/env/private';
import type { Cookies } from '@sveltejs/kit';
import { z } from 'zod';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const OAUTH_STATE_COOKIE = 'oauth_state';

/** Long enough for the round trip to the provider, short enough to be useless later. */
const OAUTH_STATE_MAX_AGE = 60 * 10;

function cookieOptions(maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: AUTH_COOKIE_SECURE,
		sameSite: AUTH_COOKIE_SAMESITE,
		domain: AUTH_COOKIE_DOMAIN,
		maxAge
	} as const;
}

function deleteCookie(cookies: Cookies, name: string): void {
	cookies.delete(name, { path: '/', domain: AUTH_COOKIE_DOMAIN });
}

export interface Session {
	accessToken: string;
	refreshToken: string;
}

/** Null unless both tokens are present — a half session is no session. */
export function getSession(cookies: Cookies): Session | null {
	const accessToken = cookies.get(ACCESS_TOKEN_COOKIE);
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);
	if (!accessToken || !refreshToken) return null;
	return { accessToken, refreshToken };
}

export function setSession(cookies: Cookies, session: Session): void {
	const options = cookieOptions(AUTH_COOKIE_MAX_AGE);
	cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, options);
	cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, options);
}

export function clearSession(cookies: Cookies): void {
	deleteCookie(cookies, ACCESS_TOKEN_COOKIE);
	deleteCookie(cookies, REFRESH_TOKEN_COOKIE);
}

const OAuthStateSchema = z.object({
	/** Echoed by the provider and compared on the way back. Defeats login CSRF. */
	nonce: z.string(),
	/** Encoded `?redirect=` value the user was heading to, if any. */
	redirectTo: z.string().nullable()
});

export type OAuthState = z.infer<typeof OAuthStateSchema>;

export function setOAuthState(cookies: Cookies, state: OAuthState): void {
	cookies.set(OAUTH_STATE_COOKIE, JSON.stringify(state), cookieOptions(OAUTH_STATE_MAX_AGE));
}

/** Reads the OAuth state and deletes it: it is valid for exactly one callback. */
export function takeOAuthState(cookies: Cookies): OAuthState | null {
	const raw = cookies.get(OAUTH_STATE_COOKIE);
	deleteCookie(cookies, OAUTH_STATE_COOKIE);
	if (!raw) return null;

	try {
		const parsed = OAuthStateSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}
