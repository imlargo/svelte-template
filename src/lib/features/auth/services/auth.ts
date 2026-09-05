import type { SignInRequest, SignInResponse } from '$lib/features/auth/types';
import type { User } from '$lib/types/user';
import { BaseService } from '$lib/core/service';
import { config } from '$lib/config/app';

export class AuthService extends BaseService {
	// Auth may live on its own host. Falls back to the data API when
	// PUBLIC_AUTH_BASE_URL is unset, which is the single-backend case.
	constructor(token: string | (() => string | null) = '') {
		super(token, config.auth.baseUrl || config.api.baseUrl);
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
}
