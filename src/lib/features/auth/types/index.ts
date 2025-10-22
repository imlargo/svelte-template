import { type User } from '$lib/domain/models/user';

export type AuthTokens = {
	accessToken: string;
	refreshToken: string;
};

export type SignInResponse = {
	user: User;
	tokens: {
		access_token: string;
		refresh_token: string;
		expires_at: number;
	};
};

export type SignUpResponse = {
	user: User;
	tokens: {
		access_token: string;
		refresh_token: string;
		expires_at: number;
	};
};

export type ChangePasswordResponse = {
	authToken: string;
};

export type SignInRequest = {
	email: string;
	password: string;
};

export type SignUpRequest = {
	email: string;
};

export type ChangePasswordRequest = {
	old_password: string;
	new_password: string;
	new_password_confirm: string;
};
