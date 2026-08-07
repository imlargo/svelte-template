/**
 * The single exit point for logs. Swap the console calls here for Sentry or
 * structured logging without touching the rest of the codebase.
 */
import { normalizeError } from '$lib/core/errors';

/** Logs the error under `scope` and returns the message that is safe to show a user. */
export function logError(scope: string, error: unknown): string {
	const normalized = normalizeError(error);
	console.error(`[${scope}]`, normalized);
	return normalized.getMessage();
}
