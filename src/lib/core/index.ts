// API client — built on air (https://github.com/imlargo/air); import `AirClient`/
// `AirOptions` straight from '@korastd/air' when you need those types.
export { createApiClient } from './api';
export type { ApiClientOptions } from './api';

// Errors
export { AppError, ApiError, ValidationError, normalizeError, getErrorMessage } from './errors';
export type { ErrorCode } from './errors';

// Service base class
export { BaseService } from './service';

// Async loading helper
export { withLoading } from './helpers/with-loading.svelte';
export type { LoadingState } from './helpers/with-loading.svelte';
