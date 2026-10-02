import { create } from '@imlargo/air';
import type { AirClient, Fetch } from '@imlargo/air';
import { config } from '#lib/config/app.js';

/** A fixed token, or a getter read on every request so a renewed one is picked up. */
type TokenSource = string | null | undefined | (() => string | null | undefined);

/**
 * Who a request is made as, and through what: on the server the per-request
 * `event.fetch`, on the client a `fetch` that reacts to a 401
 * (`features/auth/client-session.svelte.ts`).
 */
export interface ApiAuth {
	token?: TokenSource;
	/** Defaults to the global `fetch`. */
	fetch?: Fetch;
}

export type ApiClientOptions = ApiAuth & {
	baseUrl?: string;
};

/** An air client (https://github.com/imlargo/air) that sends the token as a bearer header. */
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
