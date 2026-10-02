import type { Fetch } from '@imlargo/air';
import { refresh } from '@imlargo/air/refresh';

interface AuthTransportOptions {
	/** Never awaited by the request that triggered it, so it handles its own failures. */
	onUnauthorized: () => Promise<unknown>;
	/**
	 * Resolves to a renewed access token, or null when the session cannot be
	 * renewed. Omit it to go straight to `onUnauthorized`.
	 *
	 * Receives the `fetch` underneath the retry layer: a renewal sent through
	 * the wrapped one would wait on itself forever.
	 */
	renew?: (fetch: Fetch) => Promise<string | null>;
	/** Defaults to the global `fetch`, resolved per request. */
	fetch?: Fetch;
}

/**
 * The `fetch` client-side services send through, and the one place the
 * browser reacts to a 401. With `renew`, air's `refresh` renews once and
 * re-sends (concurrent failures share that renewal); a 401 that survives runs
 * `onUnauthorized`, once per burst.
 */
export function createAuthTransport(options: AuthTransportOptions): Fetch {
	const { onUnauthorized, renew, fetch: send = (url, init) => fetch(url, init) } = options;

	const transport = renew
		? refresh({
				fetch: send,
				headers: async (base): Promise<HeadersInit> => {
					const token = await renew(base);
					// No token: the retry answers 401 again and the outer layer takes over.
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
