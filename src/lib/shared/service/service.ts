import api from '$lib/shared/api';
import { authStore } from '../../features/auth/stores/auth.svelte';

/**
 * Base controller class that handles authentication and common API functionality
 */
export class BaseService {
	protected api = api;
	protected token?: string;

	constructor(token?: string) {
		this.token = token;
	}

	/**
	 * Get the current authentication token
	 */
	protected getToken(): string {
		return this.token || authStore.getAccessToken() || '';
	}

	/**
	 * Make an authenticated GET request
	 */
	protected async get<T>(endpoint: string): Promise<T> {
		return this.api.get<T>(endpoint, {}, this.getToken());
	}

	/**
	 * Make an authenticated POST request
	 */
	protected async post<T, D = any>(endpoint: string, data?: D): Promise<T> {
		return this.api.post<T, D>(endpoint, data, {}, this.getToken());
	}

	/**
	 * Make an authenticated PUT request
	 */
	protected async put<T, D = any>(endpoint: string, data: D): Promise<T> {
		return this.api.put<T, D>(endpoint, data, {}, this.getToken());
	}

	/**
	 * Make an authenticated DELETE request
	 */
	protected async delete<T>(endpoint: string): Promise<T> {
		return this.api.delete<T>(endpoint, undefined, {}, this.getToken());
	}

	/**
	 * Make an authenticated PATCH request
	 */
	protected async patch<T, D = any>(endpoint: string, data?: D): Promise<T> {
		return this.api.patch<T, D>(endpoint, data, {}, this.getToken());
	}
}
