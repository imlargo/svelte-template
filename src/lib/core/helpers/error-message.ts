import { ApiError } from '$lib/core/api/errors';

export function getErrorMessage(err: unknown): string {
	return ApiError.from(err).getMessage();
}
