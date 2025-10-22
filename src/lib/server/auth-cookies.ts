import type { Cookies } from '@sveltejs/kit';

const dev = true;

export class AuthCookies {
	private static readonly ACCESS_TOKEN_COOKIE_NAME = 'access_token';
	private static readonly REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
	private static readonly MAX_AGE = 60 * 60 * 24 * 7; // 1 week

	static getAuthTokens(cookies: Cookies): { accessToken?: string; refreshToken?: string } {
		return {
			accessToken: cookies.get(this.ACCESS_TOKEN_COOKIE_NAME),
			refreshToken: cookies.get(this.REFRESH_TOKEN_COOKIE_NAME)
		};
	}

	static setAuthCookies(cookies: Cookies, accessToken: string, refreshToken: string): void {
		this.setCookie(cookies, this.ACCESS_TOKEN_COOKIE_NAME, accessToken);
		this.setCookie(cookies, this.REFRESH_TOKEN_COOKIE_NAME, refreshToken);
	}

	static deleteAuthCookies(cookies: Cookies): void {
		this.deleteCookie(cookies, this.ACCESS_TOKEN_COOKIE_NAME);
		this.deleteCookie(cookies, this.REFRESH_TOKEN_COOKIE_NAME);
	}

	static hasAuthCookies(cookies: Cookies): boolean {
		const accessToken = cookies.get(this.ACCESS_TOKEN_COOKIE_NAME);
		const refreshToken = cookies.get(this.REFRESH_TOKEN_COOKIE_NAME);

		return (
			accessToken !== undefined &&
			accessToken !== '' &&
			refreshToken !== undefined &&
			refreshToken !== ''
		);
	}

	private static setCookie(cookies: Cookies, cookieName: string, cookieValue: string): void {
		const cookieOptions = {
			maxAge: this.MAX_AGE,
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax' as const
		};

		cookies.set(cookieName, cookieValue, cookieOptions);
	}

	private static deleteCookie(cookies: Cookies, cookieName: string): void {
		try {
			if (!dev) {
				cookies.delete(cookieName, {
					path: '/'
				});
			} else {
				cookies.delete(cookieName, { path: '/' });
			}
		} catch (error) {
			console.error(`Error deleting cookie ${cookieName}:`, error);
			try {
				cookies.delete(cookieName, { path: '/' });
			} catch (fallbackError) {
				console.error(`Error in fallback cookie deletion for ${cookieName}:`, fallbackError);
			}
		}
	}
}
