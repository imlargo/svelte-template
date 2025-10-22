import type { User } from '$lib/domain/models/user';

class AuthStore {
	accessToken = $state('');
	refreshToken = $state('');
	user: User | null = $state(null);

	clearAuthToken() {
		this.accessToken = '';
		this.refreshToken = '';
	}

	isAuthenticated() {
		return this.accessToken !== '';
	}

	getAccessToken() {
		return this.accessToken;
	}

	setAccessToken(token: string) {
		this.accessToken = token;
	}

	setUser(user: User) {
		this.user = user;
	}

	deleteUser() {
		this.user = null;
	}

	getUser() {
		return this.user;
	}

	logout() {
		this.clearAuthToken();
		this.deleteUser();
	}
}

export const storeAuth = new AuthStore();
