/**
 * $core — core infrastructure layer.
 *
 * Use the `$core` alias (configured in svelte.config.js) or import directly:
 *   import { createApiClient } from '$core/api';
 *   import { BaseService } from '$core/service';
 *   import { toFormData } from '$core/tools';
 */
export {
	createApiClient,
	ApiClient,
	ApiError,
	getErrorMessage,
	toApiError,
	isApiErrorResponse
} from './api';
export type { ApiOptions, ApiErrorResponse, ApiClientOptions } from './api';
export { BaseService } from './service';
export { toFormData, toQueryParams, toCleanJSON, getInitials } from './tools';
export { timeFilterLabel } from './tools/date';
export type { TimeFilter } from './tools/date';
