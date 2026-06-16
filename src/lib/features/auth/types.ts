import type { User } from '$lib/types/auth/user';

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface AuthTokensResponse {
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export interface SignInResponse {
	user: User;
	tokens: AuthTokensResponse;
}

export interface SignUpResponse {
	user: User;
	tokens: AuthTokensResponse;
}

export interface ChangePasswordResponse {
	authToken: string;
}

export interface SignInRequest {
	email: string;
	password: string;
}

export interface SignUpRequest {
	email: string;
	name?: string;
	password: string;
}

export interface ChangePasswordRequest {
	old_password: string;
	new_password: string;
	new_password_confirm: string;
}
