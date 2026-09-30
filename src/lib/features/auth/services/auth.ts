import type { AuthTokensResponse, SignInRequest, SignInResponse } from '$lib/features/auth/types';
import type { User } from '$lib/types/user';
import type { ApiAuth } from '$lib/core/api';
import { BaseService } from '$lib/core/service';
import { config } from '$lib/config/app';

export class AuthService extends BaseService {
	// Auth may live on its own host. Falls back to the data API when
	// PUBLIC_AUTH_BASE_URL is unset, which is the single-backend case.
	constructor(auth: ApiAuth = {}) {
		super(auth, config.auth.baseUrl || config.api.baseUrl);
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
	 * Only called with `PUBLIC_AUTH_REFRESH_ENABLED=true`. The contract the
	 * backend has to meet: `POST /auth/refresh` with `{ refresh_token }` answers
	 * a fresh token pair, and a refresh token it no longer accepts answers 401.
	 * A backend that does not rotate refresh tokens can send the same one back.
	 */
	refresh(refreshToken: string) {
		return this.expectBody(
			this.api.post<AuthTokensResponse>('/auth/refresh', { body: { refresh_token: refreshToken } })
		);
	}
}
