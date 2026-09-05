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
 * `baseUrl` exists because auth and data can live on different hosts: a service
 * overrides it to target another API. Omit it to use `config.api.baseUrl`.
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
import { AppError } from '$lib/core/errors';
import type { AirClient } from '@imlargo/air';

export class BaseService {
	protected api: AirClient;

	constructor(token: string | (() => string | null) = '', baseUrl?: string) {
		// Each service gets its own client so the getToken closure resolves correctly.
		this.api = createApiClient({
			baseUrl,
			getToken: () => (typeof token === 'function' ? token() : token)
		});
	}

	/**
	 * Narrows air's `T | null` for an endpoint that must answer with a body.
	 * air resolves a 204 or an empty body to `null`; where the caller asked for a
	 * resource, that is a broken response, not data — so it fails here instead of
	 * leaking a `null` into every consumer. A call that legitimately answers with
	 * no body (a `DELETE`) skips this.
	 */
	protected async expectBody<T>(request: Promise<T | null>): Promise<T> {
		const data = await request;
		if (data === null) throw new AppError('SERVER_ERROR', 'The server returned an empty response.');
		return data;
	}
}
