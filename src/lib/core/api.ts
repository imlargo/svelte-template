import { create } from '@imlargo/air';
import type { AirClient, Fetch } from '@imlargo/air';

/** A token, or a getter so a renewed one is picked up. */
export type TokenSource = string | null | undefined | (() => string | null | undefined);

/** Who a request is made as: on the server `event.fetch`, on the client the 401-aware fetch of `ClientSession`. */
export interface ApiAuth {
	token?: TokenSource;
	/** Defaults to the global `fetch`. */
	fetch?: Fetch;
}

/** Base URL for the app's own routes. */
export const SAME_ORIGIN = '';

/** An air client that sends the token as a bearer header. */
export function createApiClient(baseUrl: string, auth: ApiAuth = {}): AirClient {
	const { token, fetch } = auth;

	return create({
		baseURL: baseUrl,
		fetch,
		headers: (): Record<string, string> => {
			const value = typeof token === 'function' ? token() : token;
			return value ? { Authorization: `Bearer ${value}` } : {};
		}
	});
}
