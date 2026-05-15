/**
 * $lib public API — import from here for the most common utilities.
 *
 * Feature modules (auth, etc.) are intentionally NOT re-exported here.
 * Import features directly: `import { authStore } from '$lib/features/auth'`
 */

// Config
export { config } from './config';
export type { AppConfig } from './config';

// Core API
export {
	createApiClient,
	ApiClient,
	ApiError,
	getErrorMessage,
	toApiError,
	isApiErrorResponse
} from './core/api';
export type { ApiOptions, ApiErrorResponse } from './core/api';

// Core service
export { BaseService } from './core/service';

// Core tools
export { toFormData, toQueryParams, toCleanJSON, getInitials } from './core/tools';

// Domain
export type { BaseEntity } from './domain/models/base';
export type { User } from './domain/models/user';

// UI utilities
export { cn } from './utils';
