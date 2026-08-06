/**
 * API client factory, backed by air (https://github.com/imlargo/air).
 *
 * Usage:
 *   import { createApiClient } from '$lib/core/api';
 *   const client = createApiClient({ getToken: () => authStore.getAccessToken() });
 */
import { config } from '$lib/config';
import { createApiClient as createClient } from './client';
import type { ApiClient, ApiClientOptions } from './client';

export type { ApiClient, ApiOptions, ApiClientOptions } from './client';
export { isAirError, AirError } from '@korastd/air';
export { ApiError, isApiErrorResponse, toApiError, getErrorMessage } from '$lib/core/errors';

/**
 * Create an air-based client using the app's configured base URL.
 * Call this inside constructors or functions, not at module top-level.
 */
export function createApiClient(options: Partial<ApiClientOptions> = {}): ApiClient {
	return createClient({
		baseUrl: config.api.baseUrl,
		...options
	});
}
