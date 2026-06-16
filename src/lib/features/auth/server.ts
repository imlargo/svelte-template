import { env } from '$env/dynamic/private';
import { AuthCookiesManager } from './cookies';

const maxAge = Number.parseInt(env.AUTH_COOKIE_MAX_AGE ?? '', 10);
const sameSiteRaw = (env.AUTH_COOKIE_SAMESITE ?? '').toLowerCase();
const sameSite: 'strict' | 'lax' | 'none' =
	sameSiteRaw === 'strict' || sameSiteRaw === 'none' ? sameSiteRaw : 'lax';

/** Server-side cookie manager configured from environment variables. */
export const serverAuthCookies = new AuthCookiesManager({
	domain: env.AUTH_COOKIE_DOMAIN ?? '',
	secure: env.AUTH_COOKIE_SECURE !== 'false',
	maxAgeSeconds: Number.isFinite(maxAge) && maxAge > 0 ? maxAge : undefined,
	sameSite
});
