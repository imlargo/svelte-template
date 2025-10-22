import { AuthCookiesManager } from './cookies';

export const authCookiesManager = new AuthCookiesManager({
	cookies: {
		accessTokenCookieName: 'access_token',
		refreshTokenCookieName: 'refresh_token',
		maxAgeSeconds: 3600,
		sameSite: 'lax'
	}
});
