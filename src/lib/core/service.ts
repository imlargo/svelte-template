/**
 * BaseService — wires a service to an air client with token resolution.
 *
 * Decoupled from auth: the credential and the transport are supplied via the
 * constructor (`ApiAuth`). Services that need auth receive it from the caller
 * (server load functions, actions, or the auth context on the client) rather
 * than reading a global store.
 *
 * Subclasses call `this.api.get/post/put/patch/delete(...)` directly — see
 * https://github.com/imlargo/air for the request options (`body`, `query`, ...).
 *
 * `baseUrl` exists because auth and data can live on different hosts: a service
 * overrides it to target another API. Omit it to use `config.api.baseUrl`.
 *
 * @example
 * // Server-side: the token from locals and the per-request fetch
 * const service = new UserService({ token: locals.accessToken, fetch });
 *
 * // Client-side: the session's credentials, which follow a renewed token and
 * // send the user back to sign in on a 401
 * const service = new UserService(getAuth().api);
 */
import { createApiClient, type ApiAuth } from '$lib/core/api';
import { AppError } from '$lib/core/errors';
import type { AirClient } from '@imlargo/air';

export class BaseService {
	protected api: AirClient;

	constructor(auth: ApiAuth = {}, baseUrl?: string) {
		// Each service gets its own client so the token getter resolves correctly.
		this.api = createApiClient({ ...auth, baseUrl });
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
