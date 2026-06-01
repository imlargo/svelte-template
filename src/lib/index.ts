// $lib public API — import from here for the most common utilities.
// Feature modules (auth, etc.) are intentionally NOT re-exported here.
// Import features directly: `import { authStore } from '$lib/features/auth'`

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

// Core helpers
export { withLoading } from './core/helpers/with-loading.svelte';
export type { LoadingState } from './core/helpers/with-loading.svelte';

// Utils
export { formatCurrency, formatPercent, formatNumber } from './utils/number';
export { getInitials, slugify, truncate, capitalize } from './utils/string';
export { formatDate, relativeTime, isExpired, isValidDate, timeFilterLabel } from './utils/date';
export type { TimeFilter } from './utils/date';
export { toFormData, toQueryParams, toCleanJSON } from './utils/form';

// Types
export type { User, BaseEntity } from './types/auth/user';
export type { AsyncViewState } from './types/ui/view-state';

// UI utilities
export { cn } from './utils';
