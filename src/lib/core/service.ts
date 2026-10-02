import { createApiClient, type ApiAuth } from '#lib/core/api.js';
import { AppError } from '#lib/core/errors.js';
import type { AirClient } from '@imlargo/air';

/**
 * Base of every service: the only classes that talk to the API. The caller
 * supplies the credentials — `{ token: locals.accessToken, fetch }` on the
 * server, `getAuth().api` on the client — so no service reads global state.
 *
 * `baseUrl` targets another host (auth may live apart from data); omit it for
 * `config.api.baseUrl`.
 */
export class BaseService {
	protected api: AirClient;

	constructor(auth: ApiAuth = {}, baseUrl?: string) {
		this.api = createApiClient({ ...auth, baseUrl });
	}

	/**
	 * Narrows air's `T | null` for an endpoint that must answer with a body: a
	 * 204 where a resource was asked for is a broken response, not data. A call
	 * that legitimately answers with no body (a `DELETE`) skips this.
	 */
	protected async expectBody<T>(request: Promise<T | null>): Promise<T> {
		const data = await request;
		if (data === null) throw new AppError('SERVER_ERROR', 'The server returned an empty response.');
		return data;
	}
}
