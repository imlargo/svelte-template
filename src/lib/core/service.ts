/**
 * BaseService — thin HTTP service base class.
 *
 * Decoupled from auth: the token is supplied via the constructor or per-call.
 * Services that need auth should receive the token from the caller (server load
 * functions, stores, actions) rather than reading from a global store directly.
 *
 * @example
 * // Server-side (receives token from cookies/locals)
 * const service = new UserService(accessToken);
 *
 * // Client-side (wraps with a token getter)
 * const service = new UserService(() => authStore.getAccessToken());
 */
import { createApiClient } from '$lib/core/api';
import type { ApiClient } from '$lib/core/api';

export class BaseService {
	protected api: ApiClient;
	private _token: string | (() => string | null);

	constructor(token: string | (() => string | null) = '') {
		this._token = token;
		// Each service gets its own client so getToken closures work correctly
		this.api = createApiClient({
			getToken: () => this.resolveToken()
		});
	}

	protected resolveToken(): string {
		if (typeof this._token === 'function') return this._token() ?? '';
		return this._token;
	}

	protected async get<T>(endpoint: string): Promise<T> {
		return this.api.get<T>(endpoint);
	}

	protected async post<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
		return this.api.post<T, D>(endpoint, data);
	}

	protected async put<T, D = unknown>(endpoint: string, data: D): Promise<T> {
		return this.api.put<T, D>(endpoint, data);
	}

	protected async patch<T, D = unknown>(endpoint: string, data?: D): Promise<T> {
		return this.api.patch<T, D>(endpoint, data);
	}

	protected async delete<T>(endpoint: string): Promise<T> {
		return this.api.delete<T>(endpoint);
	}
}
