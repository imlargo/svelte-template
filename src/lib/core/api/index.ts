/**
 * API client factory, backed by air (https://github.com/imlargo/air).
 *
 * Usage:
 *   import { createApiClient } from '$lib/core/api';
 *   const client = createApiClient({ getToken: () => authStore.getAccessToken() });
 */
import { create } from '@korastd/air';
import type { AirClient } from '@korastd/air';
import { config } from '$lib/config';

export type ApiClientOptions = {
	baseUrl?: string;
	/** Called on every request so a refreshed token is always picked up. */
	getToken?: () => string | null;
};

export function createApiClient(options: ApiClientOptions = {}): AirClient {
	const { baseUrl = config.api.baseUrl, getToken } = options;

	return create({
		baseURL: baseUrl,
		headers: (): Record<string, string> => {
			const token = getToken?.();
			return token ? { Authorization: `Bearer ${token}` } : {};
		}
	});
}
