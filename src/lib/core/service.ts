import { createApiClient, type ApiAuth } from '#lib/core/api.js';
import { AppError } from '#lib/core/errors.js';
import type { AirClient } from '@imlargo/air';

/**
 * Base of every service, the only classes that talk to the API. Credentials
 * come from the caller: `{ token: locals.accessToken, fetch }` on the server,
 * `getAuth().api` on the client. `baseUrl` defaults to `config.api.baseUrl`.
 */
export class BaseService {
	protected api: AirClient;

	constructor(auth: ApiAuth = {}, baseUrl?: string) {
		this.api = createApiClient({ ...auth, baseUrl });
	}

	/** For endpoints that must answer with a body: air resolves a 204 to null. Skip it for a DELETE. */
	protected async expectBody<T>(request: Promise<T | null>): Promise<T> {
		const data = await request;
		if (data === null) throw new AppError('SERVER_ERROR', 'The server returned an empty response.');
		return data;
	}
}
