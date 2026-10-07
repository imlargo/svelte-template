/** The single exit point for logs. For Sentry or JSON, implement `Logger` and call `setLogger`. */
import { normalizeError } from '#lib/core/errors.js';

/** Searchable detail for a log line. Never a token. */
type LogContext = Record<string, unknown>;

export interface Logger {
	info(scope: string, message: string, context?: LogContext): void;
	warn(scope: string, message: string, context?: LogContext): void;
	/** Logs the error and returns the message that is safe to show. */
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

export function setLogger(impl: Logger): void {
	logger = impl;
}
