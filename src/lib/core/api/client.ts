import { create } from '@korastd/air';
import type { AirClient, AirOptions } from '@korastd/air';

export type ApiOptions = AirOptions;
export type ApiClient = AirClient;

export type ApiClientOptions = {
	baseUrl: string;
	/** Optional static token used for every request. */
	defaultToken?: string;
	/**
	 * Optional callback that returns the current auth token dynamically.
	 * Takes precedence over `defaultToken`.
	 */
	getToken?: () => string | null;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
	const { baseUrl, defaultToken, getToken } = options;

	return create({
		baseURL: baseUrl,
		headers: (): Record<string, string> => {
			const token = getToken?.() ?? defaultToken;
			return token ? { Authorization: `Bearer ${token}` } : {};
		}
	});
}
