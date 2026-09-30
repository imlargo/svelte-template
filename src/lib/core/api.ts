/**
 * API client factory, backed by air (https://github.com/imlargo/air).
 *
 * Usage:
 *   import { createApiClient } from '$lib/core/api';
 *   const client = createApiClient({ token: () => auth.accessToken });
 */
import { create } from '@imlargo/air';
import type { AirClient, Fetch } from '@imlargo/air';
import { config } from '$lib/config/app';

/** A fixed token, or a getter read on every request so a renewed one is picked up. */
export type TokenSource = string | null | undefined | (() => string | null | undefined);

/**
 * Who a request is made as, and through what. Services take this instead of a
 * bare token because the transport matters as much as the credential: on the
 * server it is the per-request `event.fetch`, on the client a `fetch` that
 * knows how to react to a 401 (see `features/auth/client-session.svelte.ts`).
 */
export interface ApiAuth {
	token?: TokenSource;
	/** Defaults to the global `fetch`. */
	fetch?: Fetch;
}

export type ApiClientOptions = ApiAuth & {
	baseUrl?: string;
};

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
