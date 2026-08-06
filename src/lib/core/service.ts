/**
 * BaseService — wires a service to an air client with token resolution.
 *
 * Decoupled from auth: the token is supplied via the constructor. Services that
 * need auth should receive the token from the caller (server load functions,
 * stores, actions) rather than reading from a global store directly.
 *
 * Subclasses call `this.api.get/post/put/patch/delete(...)` directly — see
 * https://github.com/imlargo/air for the request options (`body`, `query`, ...).
 *
 * @example
 * // Server-side (receives token from cookies/locals)
 * const service = new UserService(accessToken);
 *
 * // Client-side (wraps with a token getter)
 * const service = new UserService(() => authStore.getAccessToken());
 */
import { createApiClient } from '$lib/core/api';
import type { AirClient } from '@korastd/air';

export class BaseService {
	protected api: AirClient;

	constructor(token: string | (() => string | null) = '') {
		// Each service gets its own client so the getToken closure resolves correctly.
		this.api = createApiClient({
			getToken: () => (typeof token === 'function' ? token() : token)
		});
	}
}
