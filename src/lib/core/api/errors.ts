// Re-exports for backward compatibility — import from $lib/core/errors directly.
export { AppError, ApiError, ValidationError, normalizeError, getErrorMessage } from '$lib/core/errors';
export type { ErrorCode } from '$lib/core/errors';

import { ApiError } from '$lib/core/errors';

export function isApiErrorResponse(err: unknown): boolean {
	return ApiError.isShape(err);
}

export function toApiError(err: unknown): ApiError {
	return ApiError.isShape(err)
		? new ApiError((err as { code?: number }).code ?? 0, err.status, err.message)
		: ApiError.isShape(err)
			? new ApiError(0, 'UNKNOWN_ERROR', String(err))
			: new ApiError(0, 'UNKNOWN_ERROR', err instanceof Error ? err.message : String(err));
}
