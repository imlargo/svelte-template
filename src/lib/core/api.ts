import { create } from '@imlargo/air';
import type { AirClient, Fetch } from '@imlargo/air';
import { config } from '#lib/config/app.js';

/** A token, or a getter so a renewed one is picked up. */
type TokenSource = string | null | undefined | (() => string | null | undefined);

/** Who a request is made as: on the server `event.fetch`, on the client the 401-aware fetch of `ClientSession`. */
export interface ApiAuth {
	token?: TokenSource;
	/** Defaults to the global `fetch`. */
	fetch?: Fetch;
}

export type ApiClientOptions = ApiAuth & {
	baseUrl?: string;
};

/** An air client that sends the token as a bearer header. */
export function createApiClient(options: ApiClientOptions = {}): AirClient {
	const { baseUrl = config.api.baseUrl, token, fetch } = options;

	return create({
		baseURL: baseUrl,
		fetch,
		headers: (): Record<string, string> => {
			const value = typeof token === 'function' ? token() : token;
			return value ? { Authorization: `Bearer ${value}` } : {};
		}
	});
}
