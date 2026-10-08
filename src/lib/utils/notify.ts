import { toast } from 'svelte-sonner';
import { normalizeError, type AppError } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';

/**
 * The one way to report a failure the user triggered: the safe message as a
 * toast, and the detail in the log only when it is a bug rather than an
 * answer from the backend.
 */
export function reportError(err: unknown, scope = 'ui'): AppError {
	const error = normalizeError(err);
	if (error.code === 'UNKNOWN') logger.error(scope, error);
	toast.error(error.message);
	return error;
}
