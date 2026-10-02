import type {
	AuthTokensResponse,
	SignInRequest,
	SignInResponse
} from '#lib/features/auth/types.js';
import type { User } from '#lib/types/user.js';
import type { ApiAuth } from '#lib/core/api.js';
import { BaseService } from '#lib/core/service.js';
import { config } from '#lib/config/app.js';

export class AuthService extends BaseService {
	constructor(auth: ApiAuth = {}) {
		super(auth, config.auth.baseUrl);
	}

	login(data: SignInRequest) {
		return this.expectBody(this.api.post<SignInResponse>('/auth/login', { body: data }));
	}

	loginWithGoogle(code: string) {
		return this.expectBody(this.api.post<SignInResponse>('/auth/google/login', { body: { code } }));
	}

	getMe() {
		return this.expectBody(this.api.get<User>('/auth/me'));
	}

	/**
	 * Only called with `PUBLIC_AUTH_REFRESH_ENABLED=true`. The backend answers a
	 * fresh token pair, or 401 for a refresh token it no longer accepts.
	 *
	 * A backend that rotates refresh tokens must accept the one it just replaced
	 * for a few seconds: two tabs can renew with the same token at once, and
	 * treating the second as reuse would revoke a session nobody stole.
	 */
	refresh(refreshToken: string) {
		return this.expectBody(
			this.api.post<AuthTokensResponse>('/auth/refresh', { body: { refresh_token: refreshToken } })
		);
	}
}
