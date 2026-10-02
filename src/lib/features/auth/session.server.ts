/**
 * The session cookies, and the only place that knows their names and options.
 *
 * The cookie lifetime is not the token lifetime: the backend decides when an
 * access token expires, and the hook finds out on the next `/auth/me`.
 */
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { z } from 'zod';
import { flag, parseEnv, unset } from '#lib/utils/env.js';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const OAUTH_STATE_COOKIE = 'oauth_state';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
/** Long enough for the round trip to the provider, short enough to be useless later. */
const OAUTH_STATE_MAX_AGE = 60 * 10;

const CookieEnvSchema = z.object({
	AUTH_COOKIE_DOMAIN: z.preprocess(unset, z.string().optional()),
	AUTH_COOKIE_SECURE: flag(true),
	AUTH_COOKIE_MAX_AGE: z.preprocess(
		unset,
		z.coerce.number().int().positive().default(DEFAULT_MAX_AGE)
	),
	AUTH_COOKIE_SAMESITE: z.preprocess(unset, z.enum(['lax', 'strict', 'none']).default('lax'))
});

const cookieEnv = parseEnv(CookieEnvSchema, env);

function cookieOptions(maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		secure: cookieEnv.AUTH_COOKIE_SECURE,
		sameSite: cookieEnv.AUTH_COOKIE_SAMESITE,
		domain: cookieEnv.AUTH_COOKIE_DOMAIN,
		maxAge
	} as const;
}

function deleteCookie(cookies: Cookies, name: string): void {
	cookies.delete(name, { path: '/', domain: cookieEnv.AUTH_COOKIE_DOMAIN });
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
	const options = cookieOptions(cookieEnv.AUTH_COOKIE_MAX_AGE);
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
