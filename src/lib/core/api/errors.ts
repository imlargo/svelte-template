export interface ApiErrorResponse {
	code: number;
	status: string;
	message: string;
	payload?: Record<string, unknown>;
}

export class ApiError extends Error implements ApiErrorResponse {
	code: number;
	status: string;
	payload?: Record<string, unknown>;

	constructor(code: number, status: string, message: string, payload?: Record<string, unknown>) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.status = status;
		this.payload = payload;
	}

	static from(error: unknown): ApiError {
		if (error instanceof ApiError) return error;
		if (isApiErrorResponse(error)) {
			return new ApiError(error.code, error.status, error.message, error.payload);
		}
		if (error instanceof Error) {
			return new ApiError(0, 'CLIENT_ERROR', error.message, { originalError: error.name });
		}
		return new ApiError(0, 'UNKNOWN_ERROR', String(error));
	}

	isNetworkError(): boolean {
		return this.status === 'NETWORK_ERROR';
	}

	isValidationError(): boolean {
		return this.status === 'BAD_REQUEST' || this.status === 'BIND_JSON';
	}

	isAuthError(): boolean {
		return this.status === 'UNAUTHORIZED';
	}

	isNotFoundError(): boolean {
		return this.status === 'NOT_FOUND';
	}

	isConflictError(): boolean {
		return this.status === 'CONFLICT';
	}

	getMessage(): string {
		if (this.message?.trim()) return this.message;
		switch (this.status) {
			case 'NETWORK_ERROR':
				return 'Connection error. Please check your internet connection.';
			case 'UNAUTHORIZED':
				return 'You do not have permission to perform this action.';
			case 'NOT_FOUND':
				return 'The requested resource was not found.';
			case 'CONFLICT':
				return 'The resource already exists or there is a conflict.';
			case 'BAD_REQUEST':
			case 'BIND_JSON':
				return 'The data provided is invalid.';
			case 'INTERNAL_SERVER_ERROR':
				return 'Internal server error. Please try again later.';
			default:
				return 'An unexpected error has occurred.';
		}
	}
}

export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
	return (
		typeof error === 'object' &&
		error !== null &&
		typeof (error as Record<string, unknown>).code === 'number' &&
		typeof (error as Record<string, unknown>).message === 'string'
	);
}

export function toApiError(error: unknown): ApiError {
	return ApiError.from(error);
}

export function getErrorMessage(error: unknown): string {
	return ApiError.from(error).getMessage();
}
