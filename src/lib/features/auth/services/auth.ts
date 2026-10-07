import type { ApiAuth } from '#lib/core/api.js';
import { BaseService } from '#lib/core/service.js';
import { config } from '#lib/config/app.js';
import type { User } from '#lib/types/user.js';
import type { Session } from '#lib/features/auth/types.js';
import type { LoginInput } from '#lib/features/auth/schemas.js';
import {
	AUTH_ENDPOINTS,
	toSession,
	type SignInWire,
	type TokenPairWire
} from '#lib/features/auth/contract.js';

/** Talks to the backend's auth endpoints and answers in the app's own types. */
export class AuthService extends BaseService {
	constructor(auth: ApiAuth = {}) {
		super(config.auth.baseUrl, auth);
	}

	async login(body: LoginInput): Promise<Session> {
		const { tokens } = await this.expectBody(
			this.api.post<SignInWire>(AUTH_ENDPOINTS.login, { body })
		);
		return toSession(tokens);
	}

	async loginWithGoogle(code: string): Promise<Session> {
		const { tokens } = await this.expectBody(
			this.api.post<SignInWire>(AUTH_ENDPOINTS.googleLogin, { body: { code } })
		);
		return toSession(tokens);
	}

	getMe(): Promise<User> {
		return this.expectBody(this.api.get<User>(AUTH_ENDPOINTS.me));
	}

	/**
	 * Only with `PUBLIC_AUTH_REFRESH_ENABLED=true`. A backend that rotates
	 * refresh tokens must accept the one it just replaced for a few seconds:
	 * two tabs can renew with the same token at once.
	 */
	async refresh(refreshToken: string): Promise<Session> {
		return toSession(
			await this.expectBody(
				this.api.post<TokenPairWire>(AUTH_ENDPOINTS.refresh, {
					body: { refresh_token: refreshToken }
				})
			)
		);
	}
}
