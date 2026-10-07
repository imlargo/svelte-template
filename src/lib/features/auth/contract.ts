/**
 * The backend's side of authentication: endpoint paths, the shape of what it
 * answers, and how that becomes a `Session`. The one file to edit when a
 * backend speaks differently.
 */
import type { Session } from '#lib/features/auth/types.js';

export const AUTH_ENDPOINTS = {
	login: '/auth/login',
	googleLogin: '/auth/google/login',
	me: '/auth/me',
	refresh: '/auth/refresh'
} as const;

export interface TokenPairWire {
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

/** Login and the Google exchange answer the user and a token pair; only the pair is kept. */
export interface SignInWire {
	tokens: TokenPairWire;
}

export function toSession(wire: TokenPairWire): Session {
	return { accessToken: wire.access_token, refreshToken: wire.refresh_token };
}
