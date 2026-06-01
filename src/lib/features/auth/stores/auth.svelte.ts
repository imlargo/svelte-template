import type { User } from '$lib/types/auth/user';
import type { AuthTokens } from '../types';

export class AuthStore<T> {
	private userData: T | null = $state(null);
	private tokens: AuthTokens | null = $state(null);

	readonly authenticated = $derived(this.isLoggedIn());
	readonly user = $derived(this.userData);

	login(accessToken: string, refreshToken: string, user: T) {
		if (!accessToken) throw new Error('Access token cannot be empty');
		if (!refreshToken) throw new Error('Refresh token cannot be empty');

		this.userData = user;
		this.tokens = { accessToken, refreshToken };
	}

	logout() {
		this.userData = null;
		this.tokens = null;
	}

	private isLoggedIn(): boolean {
		return (
			this.userData != null &&
			this.tokens != null &&
			!!this.tokens.accessToken &&
			!!this.tokens.refreshToken
		);
	}

	getAccessToken(): string | null {
		return this.tokens?.accessToken ?? null;
	}

	getRefreshToken(): string | null {
		return this.tokens?.refreshToken ?? null;
	}
}

export const authStore = new AuthStore<User>();
