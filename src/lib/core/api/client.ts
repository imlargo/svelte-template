import { create } from '@korastd/air';
import type { AirClient, AirOptions } from '@korastd/air';

export type ApiOptions = AirOptions;
export type ApiClient = AirClient;

export type ApiClientOptions = {
	baseUrl: string;
	/** Called on every request so a refreshed token is always picked up. */
	getToken?: () => string | null;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
	const { baseUrl, getToken } = options;

	return create({
		baseURL: baseUrl,
		headers: (): Record<string, string> => {
			const token = getToken?.();
			return token ? { Authorization: `Bearer ${token}` } : {};
		}
	});
}
