export type AuthCookiesManagerOptions = {
	cookies: {
		accessTokenCookieName?: string;
		refreshTokenCookieName?: string;
		domain?: string;
		maxAgeSeconds?: number;
		sameSite?: 'strict' | 'lax' | 'none' | '';
	};
};
