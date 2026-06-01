// Error codes — union type, extend as needed for your API
export type ErrorCode =
	| 'NETWORK'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'BAD_REQUEST'
	| 'SERVER_ERROR'
	| 'VALIDATION'
	| 'UNKNOWN';

const MESSAGES: Record<ErrorCode, string> = {
	NETWORK: 'Connection error. Check your internet connection.',
	UNAUTHORIZED: 'You need to log in to perform this action.',
	FORBIDDEN: 'You do not have permission for this action.',
	NOT_FOUND: 'The requested resource was not found.',
	CONFLICT: 'A conflict occurred. The resource may already exist.',
	BAD_REQUEST: 'The data provided is invalid.',
	SERVER_ERROR: 'Server error. Please try again later.',
	VALIDATION: 'Please check the form for errors.',
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

	isAuth(): boolean {
		return this.code === 'UNAUTHORIZED' || this.code === 'FORBIDDEN';
	}

	isNetwork(): boolean {
		return this.code === 'NETWORK';
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

export class ApiError extends AppError {
	readonly httpCode: number;
	readonly status: string;
	readonly payload?: Record<string, unknown>;

	constructor(httpCode: number, status: string, message: string, payload?: Record<string, unknown>) {
		super(message, STATUS_TO_CODE[status] ?? 'UNKNOWN');
		this.name = 'ApiError';
		this.httpCode = httpCode;
		this.status = status;
		this.payload = payload;
	}

	static isShape(err: unknown): err is { status: string; message: string; code?: number } {
		return (
			typeof err === 'object' &&
			err !== null &&
			typeof (err as Record<string, unknown>).status === 'string' &&
			typeof (err as Record<string, unknown>).message === 'string'
		);
	}
}

// ─── Validation errors ───────────────────────────────────────────────────────
// For form field errors: { email: 'Required', password: 'Too short' }

export class ValidationError extends AppError {
	readonly fields: Record<string, string>;

	constructor(fields: Record<string, string>, message = 'Please check the form for errors.') {
		super(message, 'VALIDATION');
		this.name = 'ValidationError';
		this.fields = fields;
	}

	getField(field: string): string | undefined {
		return this.fields[field];
	}

	// Build from a server response like { errors: { email: ['Required'] } }
	static fromRecord(record: Record<string, unknown>): ValidationError {
		const fields: Record<string, string> = {};
		for (const [key, val] of Object.entries(record)) {
			if (typeof val === 'string') fields[key] = val;
			else if (Array.isArray(val) && val.length) fields[key] = String(val[0]);
		}
		return new ValidationError(fields);
	}
}

// ─── Parser ──────────────────────────────────────────────────────────────────
// Converts any thrown value into an AppError with a known shape.

export function normalizeError(err: unknown): AppError {
	if (err instanceof AppError) return err;
	if (ApiError.isShape(err)) {
		return new ApiError(
			(err as { code?: number }).code ?? 0,
			err.status,
			err.message,
			(err as { payload?: Record<string, unknown> }).payload
		);
	}
	if (err instanceof Error) return new AppError(err.message);
	return new AppError(String(err));
}

// Returns a user-facing message from any thrown value.
export function getErrorMessage(err: unknown): string {
	return normalizeError(err).getMessage();
}
