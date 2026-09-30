import type { User } from '$lib/types/user';

/** Token pair as the API returns it. */
export interface AuthTokensResponse {
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export interface SignInRequest {
	email: string;
	password: string;
}

export interface SignInResponse {
	user: User;
	tokens: AuthTokensResponse;
}

/**
 * What this app's own `/refresh` route answers. Only the access token reaches
 * the browser: the refresh token is rotated into its httpOnly cookie.
 */
export interface RefreshedSession {
	accessToken: string;
}
