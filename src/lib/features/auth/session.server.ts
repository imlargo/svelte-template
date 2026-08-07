/**
 * The session cookies, and the only place that knows their names and options.
 *
 * Both tokens are httpOnly and share a lifetime: the template has no refresh
 * flow, so a shorter access cookie would only sign users out sooner, not buy
 * security. If your API issues short-lived access tokens, add the refresh
 * flow and split the two lifetimes together.
 */
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const OAUTH_STATE_COOKIE = 'oauth_state';

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
/** Long enough for the round trip to the provider, short enough to be useless later. */
const OAUTH_STATE_MAX_AGE = 60 * 10;

const configuredMaxAge = Number.parseInt(env.AUTH_COOKIE_MAX_AGE ?? '', 10);
const maxAge =
	Number.isFinite(configuredMaxAge) && configuredMaxAge > 0 ? configuredMaxAge : DEFAULT_MAX_AGE;

const configuredSameSite = (env.AUTH_COOKIE_SAMESITE ?? '').toLowerCase();
const sameSite =
	configuredSameSite === 'strict' || configuredSameSite === 'none' ? configuredSameSite : 'lax';

const secure = env.AUTH_COOKIE_SECURE !== 'false';
const domain = env.AUTH_COOKIE_DOMAIN || undefined;

function cookieOptions(maxAgeSeconds: number) {
	return { path: '/', httpOnly: true, secure, sameSite, maxAge: maxAgeSeconds, domain } as const;
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
	cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, cookieOptions(maxAge));
	cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, cookieOptions(maxAge));
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/', domain });
	cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/', domain });
}

export interface OAuthState {
	/** Echoed by the provider and compared on the way back. Defeats login CSRF. */
	nonce: string;
	/** Encoded `?redirect=` value the user was heading to, if any. */
	redirectTo: string | null;
}

export function setOAuthState(cookies: Cookies, state: OAuthState): void {
	cookies.set(OAUTH_STATE_COOKIE, JSON.stringify(state), cookieOptions(OAUTH_STATE_MAX_AGE));
}

/** Reads the OAuth state and deletes it: it is valid for exactly one callback. */
export function takeOAuthState(cookies: Cookies): OAuthState | null {
	const raw = cookies.get(OAUTH_STATE_COOKIE);
	cookies.delete(OAUTH_STATE_COOKIE, { path: '/', domain });
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed?.nonce !== 'string') return null;
		return { nonce: parsed.nonce, redirectTo: parsed.redirectTo ?? null };
	} catch {
		return null;
	}
}
