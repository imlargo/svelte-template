export interface AuthCookiesManagerOptions {
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
	path?: string;
	maxAge?: number;
}
