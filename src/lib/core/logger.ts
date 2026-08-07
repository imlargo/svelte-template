/**
 * The single exit point for logs. To ship Sentry or structured logging, write a
 * class that implements `Logger` and reassign `logger` — nothing else in the
 * codebase changes.
 */
import { normalizeError } from '$lib/core/errors';

export interface Logger {
	/** Logs `error` under `scope` and returns the message that is safe to show a user. */
	error(scope: string, error: unknown): string;
}

class ConsoleLogger implements Logger {
	error(scope: string, error: unknown): string {
		const normalized = normalizeError(error);
		console.error(`[${scope}]`, normalized);
		return normalized.getMessage();
	}
}

export let logger: Logger = new ConsoleLogger();

/** Swaps the active implementation — e.g. for a SentryLogger, or a no-op one in tests. */
export function setLogger(impl: Logger): void {
	logger = impl;
}
