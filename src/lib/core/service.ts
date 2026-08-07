/**
 * BaseService — wires a service to an air client with token resolution.
 *
 * Decoupled from auth: the token is supplied via the constructor. Services that
 * need auth receive it from the caller (server load functions, actions, or the
 * auth context on the client) rather than reading a global store.
 *
 * Subclasses call `this.api.get/post/put/patch/delete(...)` directly — see
 * https://github.com/imlargo/air for the request options (`body`, `query`, ...).
 *
 * @example
 * // Server-side (receives token from cookies/locals)
 * const service = new UserService(accessToken);
 *
 * // Client-side (wraps with a token getter, so it stays current)
 * const auth = getAuth();
 * const service = new UserService(() => auth().accessToken);
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
