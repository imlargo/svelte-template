import { isAirError, type AirError } from '@korastd/air';

// Error codes — union type, extend as needed for your API
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
	UNAUTHORIZED: 'You need to log in to perform this action.',
	FORBIDDEN: 'You do not have permission for this action.',
	NOT_FOUND: 'The requested resource was not found.',
	CONFLICT: 'A conflict occurred. The resource may already exist.',
	BAD_REQUEST: 'The data provided is invalid.',
	SERVER_ERROR: 'Server error. Please try again later.',
	UNKNOWN: 'An unexpected error occurred.'
};

// ─── Base ───────────────────────────────────────────────────────────────────

export class AppError extends Error {
	readonly code: ErrorCode;

	constructor(message: string, code: ErrorCode = 'UNKNOWN') {
		super(message);
		this.name = 'AppError';
		this.code = code;
	}

	getMessage(): string {
		return this.message.trim() || MESSAGES[this.code];
	}

	is(code: ErrorCode): boolean {
		return this.code === code;
	}
}

// ─── API errors ──────────────────────────────────────────────────────────────
// Extend this map to match your backend's error status strings.

const STATUS_TO_CODE: Record<string, ErrorCode> = {
	NETWORK_ERROR: 'NETWORK',
	UNAUTHORIZED: 'UNAUTHORIZED',
	FORBIDDEN: 'FORBIDDEN',
	NOT_FOUND: 'NOT_FOUND',
	CONFLICT: 'CONFLICT',
	BAD_REQUEST: 'BAD_REQUEST',
	BIND_JSON: 'BAD_REQUEST',
	UNPROCESSABLE_ENTITY: 'BAD_REQUEST',
	INTERNAL_SERVER_ERROR: 'SERVER_ERROR'
};

// Fallback for responses whose body doesn't carry a recognized `status` string —
// derive an ErrorCode straight from the HTTP status instead.
function codeForHttpStatus(httpCode: number): ErrorCode {
	switch (httpCode) {
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
			return httpCode >= 500 ? 'SERVER_ERROR' : 'UNKNOWN';
	}
}

export class ApiError extends AppError {
	readonly httpCode: number;
	readonly status: string;
	readonly payload?: Record<string, unknown>;
	/**
	 * Which call failed. Deliberately method and URL only — air also exposes the
	 * resolved request headers, but those carry the Authorization token, and this
	 * object ends up in logs.
	 */
	readonly request?: { method: string; url: string };

	constructor(
		httpCode: number,
		status: string,
		message: string,
		payload?: Record<string, unknown>,
		request?: { method: string; url: string }
	) {
		super(message, STATUS_TO_CODE[status] ?? codeForHttpStatus(httpCode));
		this.name = 'ApiError';
		this.httpCode = httpCode;
		this.status = status;
		this.payload = payload;
		this.request = request;
	}

	// Builds an ApiError from air's AirError, thrown for network failures and
	// non-2xx responses alike. Expects a JSON error body shaped like
	// `{ status, message, code, payload }`; falls back to the HTTP status when
	// the body doesn't follow that convention.
	static fromAirError(err: AirError): ApiError {
		const data =
			err.data && typeof err.data === 'object' ? (err.data as Record<string, unknown>) : {};

		const status =
			typeof data.status === 'string' ? data.status : err.response ? 'HTTP_ERROR' : 'NETWORK_ERROR';
		const message = typeof data.message === 'string' ? data.message : err.message;
		const payload =
			data.payload && typeof data.payload === 'object'
				? (data.payload as Record<string, unknown>)
				: undefined;

		return new ApiError(err.status ?? 0, status, message, payload, {
			method: err.request.method,
			url: err.request.url
		});
	}
}

// ─── Parser ──────────────────────────────────────────────────────────────────
// Converts any thrown value into an AppError with a known shape.

export function normalizeError(err: unknown): AppError {
	if (err instanceof AppError) return err;
	if (isAirError(err)) return ApiError.fromAirError(err);
	if (err instanceof Error) return new AppError(err.message);
	return new AppError(String(err));
}
