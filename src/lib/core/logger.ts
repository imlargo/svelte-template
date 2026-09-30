/**
 * The single exit point for logs. To ship Sentry or structured logging, write a
 * class that implements `Logger` and reassign `logger` — nothing else in the
 * codebase changes.
 */
import { normalizeError } from '$lib/core/errors';

/** Searchable detail attached to a log line — an `errorId`, a pathname. Never a token. */
export type LogContext = Record<string, unknown>;

export interface Logger {
	/** Something worth knowing happened, and nothing is wrong. */
	info(scope: string, message: string, context?: LogContext): void;
	/** Something is off, but the request was handled: a misconfiguration, a rejected input. */
	warn(scope: string, message: string, context?: LogContext): void;
	/** Logs `error` under `scope` and returns the message that is safe to show a user. */
	error(scope: string, error: unknown, context?: LogContext): string;
}

class ConsoleLogger implements Logger {
	info(scope: string, message: string, context?: LogContext): void {
		console.info(`[${scope}]`, message, ...(context ? [context] : []));
	}

	warn(scope: string, message: string, context?: LogContext): void {
		console.warn(`[${scope}]`, message, ...(context ? [context] : []));
	}

	error(scope: string, error: unknown, context?: LogContext): string {
		const normalized = normalizeError(error);
		console.error(`[${scope}]`, normalized, ...(context ? [context] : []));
		return normalized.message;
	}
}

export let logger: Logger = new ConsoleLogger();

/** Swaps the active implementation — e.g. for a SentryLogger, or a no-op one in tests. */
export function setLogger(impl: Logger): void {
	logger = impl;
}
