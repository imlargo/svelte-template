// Type definitions for backend error format
export interface ApiErrorResponse {
	code: number;
	status: string;
	message: string;
	payload?: Record<string, any>;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error implements ApiErrorResponse {
	code: number;
	status: string;
	payload?: Record<string, any>;

	constructor(code: number, status: string, message: string, payload?: Record<string, any>) {
		super(message);
		this.name = 'ApiError';
		this.code = code;
		this.status = status;
		this.payload = payload;
	}

	/**
	 * Create ApiError from unknown error type
	 */
	static from(error: unknown): ApiError {
		if (error instanceof ApiError) {
			return error;
		}

		if (isApiErrorResponse(error)) {
			return new ApiError(error.code, error.status, error.message, error.payload);
		}

		if (error instanceof Error) {
			return new ApiError(0, 'CLIENT_ERROR', error.message, { originalError: error.name });
		}

		return new ApiError(0, 'UNKNOWN_ERROR', String(error));
	}

	/**
	 * Check if the error is a network error
	 */
	isNetworkError(): boolean {
		return this.status === 'NETWORK_ERROR';
	}

	/**
	 * Check if the error is a validation error
	 */
	isValidationError(): boolean {
		return this.status === 'BAD_REQUEST' || this.status === 'BIND_JSON';
	}

	/**
	 * Check if the error is an authorization error
	 */
	isAuthError(): boolean {
		return this.status === 'UNAUTHORIZED';
	}

	/**
	 * Check if the error is a not found error
	 */
	isNotFoundError(): boolean {
		return this.status === 'NOT_FOUND';
	}

	/**
	 * Check if the error is a conflict error
	 */
	isConflictError(): boolean {
		return this.status === 'CONFLICT';
	}

	/**
	 * Get user-friendly error message
	 */
	getMessage(): string {
		if (this.message && typeof this.message === 'string' && this.message.trim() !== '') {
			return this.message;
		}

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

/**
 * Type guard to check if an error is an ApiErrorResponse
 */
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
	return (
		typeof error === 'object' &&
		error !== null &&
		typeof (error as any).code === 'number' &&
		typeof (error as any).message === 'string'
	);
}

/**
 * Cast an unknown error to ApiError
 */
export function toApiError(error: unknown): ApiError {
	return ApiError.from(error);
}

/**
 * Handle error and return user-friendly message
 */
export function getErrorMessage(error: unknown): string {
	return ApiError.from(error).getMessage();
}
