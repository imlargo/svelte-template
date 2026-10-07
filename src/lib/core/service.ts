import { createApiClient, type ApiAuth } from '#lib/core/api.js';
import { AppError } from '#lib/core/errors.js';
import type { AirClient } from '@imlargo/air';

/**
 * Base of every service, the only classes that talk to the API. The subclass
 * names the host; the caller supplies the credentials: `{ token:
 * locals.accessToken, fetch }` on the server, `getAuth().api` on the client.
 */
export abstract class BaseService {
	protected readonly api: AirClient;

	constructor(baseUrl: string, auth: ApiAuth = {}) {
		this.api = createApiClient(baseUrl, auth);
	}

	/** For endpoints that must answer with a body: air resolves a 204 to null. Skip it for a DELETE. */
	protected async expectBody<T>(request: Promise<T | null>): Promise<T> {
		const data = await request;
		if (data === null) throw new AppError('SERVER_ERROR', 'The server returned an empty response.');
		return data;
	}
}
