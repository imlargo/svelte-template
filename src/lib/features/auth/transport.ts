/**
 * The `fetch` client-side services send their requests through, and the one
 * place the browser reacts to a 401.
 *
 * Two layers, composed the way air composes interceptors (a function around
 * `fetch`), outer first:
 *
 * 1. On a 401 that survives everything below, `onUnauthorized` runs — once per
 *    burst, however many requests failed together. The caller decides what it
 *    means; `ClientSession` hands the decision to the server.
 * 2. With `renew`, air's `refresh` spends the refresh token first and re-sends
 *    the request once with the new access token. Requests that fail while a
 *    renewal is in flight all wait for that one renewal.
 */
import type { Fetch } from '@imlargo/air';
import { refresh } from '@imlargo/air/refresh';

interface AuthTransportOptions {
	onUnauthorized: () => Promise<unknown>;
	/**
	 * Renews the access token and resolves to the new one, or to null when the
	 * session cannot be renewed. Omit it to go straight to `onUnauthorized`.
	 *
	 * Receives the `fetch` underneath `refresh`: a renewal sent through the
	 * wrapped one would wait on the refresh it is part of, forever.
	 */
	renew?: (fetch: Fetch) => Promise<string | null>;
	/** Defaults to the global `fetch`, resolved per request. */
	fetch?: Fetch;
}

export function createAuthTransport(options: AuthTransportOptions): Fetch {
	const { onUnauthorized, renew, fetch: send = (url, init) => fetch(url, init) } = options;

	const transport = renew
		? refresh({
				fetch: send,
				headers: async (base): Promise<HeadersInit> => {
					const token = await renew(base);
					// Nothing to renew with: the retry goes out as it was, answers its
					// 401 again, and the outer layer takes it from there.
					return token ? { Authorization: `Bearer ${token}` } : {};
				}
			})
		: send;

	let handling: Promise<unknown> | null = null;

	return async (url, init) => {
		const response = await transport(url, init);
		if (response.status === 401) {
			handling ??= onUnauthorized().finally(() => (handling = null));
		}
		return response;
	};
}
