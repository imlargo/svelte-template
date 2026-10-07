/**
 * The backend's side of authentication: where its endpoints are, the shape of
 * what they answer, and how that becomes the app's own types (`types.ts`).
 *
 * The one file to edit when a backend speaks differently. Nothing past
 * `AuthService` sees an `access_token` or an `/auth/...` path: the hook, the
 * actions and the cookies only know `Session` and `User`.
 */
import type { User } from '#lib/types/user.js';
import type { Session, SignIn } from '#lib/features/auth/types.js';

export const AUTH_ENDPOINTS = {
	login: '/auth/login',
	googleLogin: '/auth/google/login',
	me: '/auth/me',
	refresh: '/auth/refresh'
} as const;

// ─── Request bodies ──────────────────────────────────────────────────────────

export interface LoginBody {
	email: string;
	password: string;
}

export interface GoogleLoginBody {
	/** The authorization code Google sent to the callback. */
	code: string;
}

export interface RefreshBody {
	refresh_token: string;
}

// ─── Responses, as the backend sends them ────────────────────────────────────

export interface TokenPairWire {
	access_token: string;
	refresh_token: string;
	/** Unix seconds. The backend stays the authority on expiry: the hook finds out on the next `/auth/me`. */
	expires_at: number;
}

export interface SignInWire {
	user: UserWire;
	tokens: TokenPairWire;
}

/** The same shape as `User` today. Map it in `toUser` when the backend's user differs. */
export type UserWire = User;

// ─── Wire → domain ───────────────────────────────────────────────────────────

export function toSession(wire: TokenPairWire): Session {
	return { accessToken: wire.access_token, refreshToken: wire.refresh_token };
}

export function toUser(wire: UserWire): User {
	return wire;
}

export function toSignIn(wire: SignInWire): SignIn {
	return { user: toUser(wire.user), session: toSession(wire.tokens) };
}
