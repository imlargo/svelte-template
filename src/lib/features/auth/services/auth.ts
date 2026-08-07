import type { SignInRequest, SignInResponse } from '$lib/features/auth/types';
import type { User } from '$lib/types/user';
import { BaseService } from '$lib/core/service';

export class AuthService extends BaseService {
	login(data: SignInRequest) {
		return this.api.post<SignInResponse>('/auth/login', { body: data });
	}

	loginWithGoogle(code: string) {
		return this.api.post<SignInResponse>('/auth/google/login', { body: { code } });
	}

	getMe() {
		return this.api.get<User>('/auth/me');
	}
}
