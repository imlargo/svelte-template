/**
 * One error type, one entry point.
 *
 * Everything the app throws or catches becomes an `AppError` through
 * `normalizeError`. `error.message` is always safe to render: either the
 * backend's own message or the default for its `code`. Anything that is only
 * useful in a log — the failed request, the backend payload, the original
 * stack — hangs off `context` and `cause`, never off the message.
 */
import { isAirError, type AirError } from '@imlargo/air';

/** Extend as your API grows. Every code needs a default message below. */
export type ErrorCode =
	| 'NETWORK'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'BAD_REQUEST'
	| 'SERVER_ERROR'
	| 'UNKNOWN';

/** Doubles as the registry of valid codes — see `codeFromStatus`. */
const MESSAGES: Record<ErrorCode, string> = {
	NETWORK: 'Connection error. Check your internet connection.',
	UNAUTHORIZED: 'You need to log in to perform this action.',
	FORBIDDEN: 'You do not have permission for this action.',
	NOT_FOUND: 'The requested resource was not found.',
	CONFLICT: 'A conflict occurred. The resource may already exist.',
	BAD_REQUEST: 'The data provided is invalid.',
	SERVER_ERROR: 'Server error. Please try again later.',
	UNKNOWN: 'An unexpected error occurred.'
};

/**
 * Diagnostic detail about a failed API call. Log-only, never rendered.
 * Method and URL but deliberately no headers: those carry the `Authorization`
 * token and this object ends up in logs.
 */
type ErrorContext = {
	method: string;
	url: string;
	/** 0 when the request never reached the server. */
	httpStatus: number;
	/**
	 * The backend's own status string, kept verbatim even when it maps to no
	 * code. A body that says `INSUFFICIENT_FUNDS` becomes an `UNKNOWN` error,
	 * and this is the only place that still names what actually happened.
	 */
	status?: string;
	payload?: Record<string, unknown>;
};

export class AppError extends Error {
	readonly code: ErrorCode;
	readonly context?: ErrorContext;

	constructor(
		code: ErrorCode,
		message?: string,
		options: { cause?: unknown; context?: ErrorContext } = {}
	) {
		super(message?.trim() || MESSAGES[code], { cause: options.cause });
		this.name = 'AppError';
		this.code = code;
		this.context = options.context;
	}
}

/** Converts anything thrown into an `AppError`. The only entry point. */
export function normalizeError(err: unknown): AppError {
	if (err instanceof AppError) return err;
	if (isAirError(err)) return fromAirError(err);
	if (err instanceof Error) return new AppError('UNKNOWN', err.message, { cause: err });
	return new AppError('UNKNOWN', String(err));
}

// ─── air → AppError ──────────────────────────────────────────────────────────
// air throws `AirError` for network failures and non-2xx responses alike.

function fromAirError(err: AirError): AppError {
	const body = readErrorBody(err.data);
	const httpStatus = err.status ?? 0;

	// The body's own status wins: a backend may answer 400 for a conflict.
	const code = (body.status && codeFromStatus(body.status)) || codeFromHttpStatus(httpStatus);

	return new AppError(code, body.message, {
		cause: err,
		context: {
			method: err.request.method,
			url: err.request.url,
			httpStatus,
			status: body.status,
			payload: body.payload
		}
	});
}

/** Reads the `{ status, message, payload }` convention out of an unknown body. */
function readErrorBody(data: unknown): {
	status?: string;
	message?: string;
	payload?: Record<string, unknown>;
} {
	if (!isRecord(data)) return {};

	return {
		status: typeof data.status === 'string' ? data.status : undefined,
		message: typeof data.message === 'string' ? data.message : undefined,
		payload: isRecord(data.payload) ? data.payload : undefined
	};
}

/**
 * Backend status string → code. Codes pass through by name; map anything else
 * your API uses here.
 */
const STATUS_ALIASES: Record<string, ErrorCode> = {
	NETWORK_ERROR: 'NETWORK',
	BIND_JSON: 'BAD_REQUEST',
	UNPROCESSABLE_ENTITY: 'BAD_REQUEST',
	INTERNAL_SERVER_ERROR: 'SERVER_ERROR'
};

function codeFromStatus(status: string): ErrorCode | undefined {
	// `hasOwn`, not `in`: 'constructor' and friends are on every object.
	if (Object.hasOwn(MESSAGES, status)) return status as ErrorCode;
	return STATUS_ALIASES[status];
}

/** Fallback when the body carries no status we recognize. */
function codeFromHttpStatus(status: number): ErrorCode {
	switch (status) {
		case 0:
			return 'NETWORK';
		case 400:
		case 422:
			return 'BAD_REQUEST';
		case 401:
			return 'UNAUTHORIZED';
		case 403:
			return 'FORBIDDEN';
		case 404:
			return 'NOT_FOUND';
		case 409:
			return 'CONFLICT';
		default:
			return status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN';
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
