/**
 * One error type, one entry point. `message` is always safe to render: the
 * backend's own or the default for the code. Log-only detail goes on `context`
 * and `cause`. How a backend spells an error body is injected with
 * `setErrorBodyParser`; the default reads `{ status, message, payload }`.
 */
import { isAirError, type AirError } from '@imlargo/air';

export type ErrorCode =
	| 'NETWORK'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'BAD_REQUEST'
	| 'SERVER_ERROR'
	| 'UNKNOWN';

const MESSAGES: Record<ErrorCode, string> = {
	NETWORK: 'Connection error. Check your internet connection.',
	UNAUTHORIZED: 'You need to sign in to perform this action.',
	FORBIDDEN: 'You do not have permission for this action.',
	NOT_FOUND: 'The requested resource was not found.',
	CONFLICT: 'A conflict occurred. The resource may already exist.',
	BAD_REQUEST: 'The data provided is invalid.',
	SERVER_ERROR: 'Server error. Please try again later.',
	UNKNOWN: 'An unexpected error occurred.'
};

/** What a parser reads out of an error body; all optional. */
export interface ParsedErrorBody {
	/** When the status is not already one of ours. */
	code?: ErrorCode;
	/** Shown as is, so it must be fit for a user. */
	message?: string;
	/** The backend's own status string, for the log. */
	status?: string;
	/** Field errors and the like. Never rendered. */
	payload?: Record<string, unknown>;
}

export type ErrorBodyParser = (body: unknown) => ParsedErrorBody;

/** The default parser: `{ status, message, payload }`, a status spelled like an `ErrorCode` being that code. */
export const readErrorBody: ErrorBodyParser = (body) => {
	if (!isRecord(body)) return {};

	const status = typeof body.status === 'string' ? body.status : undefined;

	return {
		status,
		code: status && Object.hasOwn(MESSAGES, status) ? (status as ErrorCode) : undefined,
		message: typeof body.message === 'string' ? body.message : undefined,
		payload: isRecord(body.payload) ? body.payload : undefined
	};
};

let parseErrorBody: ErrorBodyParser = readErrorBody;

/** Installs the project's parser (`#lib/config/errors`); called from the `init` hooks. */
export function setErrorBodyParser(parser: ErrorBodyParser): void {
	parseErrorBody = parser;
}

/** Log-only detail about a failed call. No headers: they carry the token. */
type ErrorContext = {
	method: string;
	url: string;
	/** 0 when the request never reached the server. */
	httpStatus: number;
	/** Kept even when it maps to no code: it is what names what happened. */
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

/** Anything that is neither an AppError nor an API failure is a bug: default message, original on `cause`. */
export function normalizeError(err: unknown): AppError {
	if (err instanceof AppError) return err;
	if (isAirError(err)) return fromAirError(err);
	return new AppError('UNKNOWN', undefined, { cause: err });
}

function fromAirError(err: AirError): AppError {
	const body = parseErrorBody(err.data);
	const httpStatus = err.status ?? 0;

	// The body's own verdict wins: a backend may answer 400 for a conflict.
	return new AppError(body.code ?? codeFromHttpStatus(httpStatus), body.message, {
		// Not the AirError itself: its request headers carry the token.
		cause: err.cause,
		context: {
			method: err.request.method,
			url: err.request.url,
			httpStatus,
			status: body.status,
			payload: body.payload
		}
	});
}

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
