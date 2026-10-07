import type { ApiAuth } from '#lib/core/api.js';
import { BaseService } from '#lib/core/service.js';
import { config } from '#lib/config/app.js';
import type { User } from '#lib/types/user.js';
import type { Session, SignIn } from '#lib/features/auth/types.js';
import {
	AUTH_ENDPOINTS,
	toSession,
	toSignIn,
	toUser,
	type GoogleLoginBody,
	type LoginBody,
	type RefreshBody,
	type SignInWire,
	type TokenPairWire,
	type UserWire
} from '#lib/features/auth/contract.js';

/**
 * Talks to the backend's auth endpoints and answers in the app's own types.
 * The paths and the wire shapes live in `contract.ts`; this class only pairs
 * each call with its mapper.
 */
export class AuthService extends BaseService {
	constructor(auth: ApiAuth = {}) {
		super(auth, config.auth.baseUrl);
	}

	async login(body: LoginBody): Promise<SignIn> {
		return toSignIn(
			await this.expectBody(this.api.post<SignInWire>(AUTH_ENDPOINTS.login, { body }))
		);
	}

	async loginWithGoogle(code: string): Promise<SignIn> {
		const body: GoogleLoginBody = { code };
		return toSignIn(
			await this.expectBody(this.api.post<SignInWire>(AUTH_ENDPOINTS.googleLogin, { body }))
		);
	}

	async getMe(): Promise<User> {
		return toUser(await this.expectBody(this.api.get<UserWire>(AUTH_ENDPOINTS.me)));
	}

	/**
	 * Only called with `PUBLIC_AUTH_REFRESH_ENABLED=true`. The backend answers a
	 * fresh token pair, or 401 for a refresh token it no longer accepts.
	 *
	 * A backend that rotates refresh tokens must accept the one it just replaced
	 * for a few seconds: two tabs can renew with the same token at once, and
	 * treating the second as reuse would revoke a session nobody stole.
	 */
	async refresh(refreshToken: string): Promise<Session> {
		const body: RefreshBody = { refresh_token: refreshToken };
		return toSession(
			await this.expectBody(this.api.post<TokenPairWire>(AUTH_ENDPOINTS.refresh, { body }))
		);
	}
}
