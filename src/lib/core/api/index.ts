/**
 * API client factory.
 *
 * Usage:
 *   import { createApiClient } from '$lib/core/api';
 *   const client = createApiClient({ getToken: () => authStore.getAccessToken() });
 */
import { config } from '$lib/config';
import { ApiClient, type ApiClientOptions } from './client';

export { ApiClient } from './client';
export { ApiError, isApiErrorResponse, toApiError, getErrorMessage } from './errors';
export type { ApiOptions, ApiClientOptions } from './client';
export type { ErrorCode } from './errors';

/**
 * Create an ApiClient using the app's configured base URL.
 * Call this inside constructors or functions, not at module top-level.
 */
export function createApiClient(options: Partial<ApiClientOptions> = {}): ApiClient {
	return new ApiClient({
		baseUrl: config.api.baseUrl,
		...options
	});
}
