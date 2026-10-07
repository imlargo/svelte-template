import type { Fetch } from '@imlargo/air';
import { refresh } from '@imlargo/air/refresh';

interface AuthTransportOptions {
	/** Not awaited by the request that triggered it; handles its own failures. */
	onUnauthorized: () => Promise<unknown>;
	/**
	 * A renewed access token, or null. Gets the `fetch` underneath the retry
	 * layer: through the wrapped one it would wait on itself.
	 */
	renew?: (fetch: Fetch) => Promise<string | null>;
	fetch?: Fetch;
}

/**
 * The one place the browser reacts to a 401. With `renew`, air's `refresh`
 * renews once and re-sends; concurrent failures share that renewal. A 401 that
 * survives runs `onUnauthorized`, once per burst.
 */
export function createAuthTransport(options: AuthTransportOptions): Fetch {
	const { onUnauthorized, renew, fetch: send = (url, init) => fetch(url, init) } = options;

	const transport = renew
		? refresh({
				fetch: send,
				headers: async (base): Promise<HeadersInit> => {
					const token = await renew(base);
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
