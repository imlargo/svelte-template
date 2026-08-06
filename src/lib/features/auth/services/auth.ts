import type {
	SignInRequest,
	SignInResponse,
	SignUpRequest,
	SignUpResponse,
	ChangePasswordRequest,
	ChangePasswordResponse
} from '$lib/features/auth/types';
import type { User } from '$lib/types/auth/user';
import { BaseService } from '$lib/core/service';

export class AuthService extends BaseService {
	async login(data: SignInRequest) {
		return await this.api.post<SignInResponse>('/auth/login', { body: data });
	}

	async register(data: SignUpRequest) {
		return await this.api.post<SignUpResponse>('/auth/register', { body: data });
	}

	async loginWithGoogle(code: string) {
		return await this.api.post<SignInResponse>('/auth/google/login', { body: { code } });
	}

	async getMe() {
		return await this.api.get<User>('/auth/me');
	}

	async changePassword(data: ChangePasswordRequest) {
		return await this.api.post<ChangePasswordResponse>('/auth/change-password', { body: data });
	}
}
