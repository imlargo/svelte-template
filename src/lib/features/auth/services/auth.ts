import type {
	SignInRequest,
	SignInResponse,
	SignUpRequest,
	SignUpResponse,
	ChangePasswordRequest,
	ChangePasswordResponse
} from '$lib/features/auth/types';
import type { User } from '$lib/domain/models/user';
import { BaseService } from '$lib/shared/service/service';

export class AuthService extends BaseService {
	async login(data: SignInRequest) {
		return await this.post<SignInResponse, SignInRequest>('/auth/login', data);
	}

	async register(data: SignUpRequest) {
		return await this.post<SignUpResponse, SignUpRequest>('/auth/register', data);
	}

	async loginWithGoogle(code: string) {
		return await this.post<SignInResponse>('/auth/google/login', { code });
	}

	async getMe() {
		return await this.get<User>('/auth/me');
	}

	async changePassword(data: ChangePasswordRequest) {
		return await this.post<ChangePasswordResponse, ChangePasswordRequest>(
			'/auth/change-password',
			data
		);
	}
}
