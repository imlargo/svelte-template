import { ApiError } from './error';

export interface ApiOptions extends RequestInit {
	headers?: HeadersInit;
}

type ApiClientOptions = {
	baseUrl: string;
	defaultToken?: string;
	retrieveAuthToken?: () => string;
};

export class ApiClient {
	private baseUrl: string;
	private defaultToken: string;
	private retrieveAuthToken?: () => string;

	/**
	 * Constructs a new API client
	 * @param baseUrl Base URL for all requests
	 * @param defaultToken Default authentication token
	 */
	constructor(options: ApiClientOptions) {
		this.baseUrl = options.baseUrl;
		this.defaultToken = options.defaultToken || '';
		this.retrieveAuthToken = options.retrieveAuthToken;
	}

	/**
	 * Creates headers for the request with authentication
	 */
	private createHeaders(options: ApiOptions = {}, accessToken: string = ''): HeadersInit {
		const localToken = this.retrieveAuthToken ? this.retrieveAuthToken() : '';
		const token = localToken && localToken !== '' ? localToken : accessToken || this.defaultToken;

		// Check if body is FormData to not send Content-Type
		const isFormData = options.body instanceof FormData;

		return {
			// Only add Content-Type if it's not FormData
			...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers
		};
	}

	/**
	 * Processes the API response
	 */
	private async handleResponse<T>(response: Response): Promise<T> {
		const responseData = await response.json();

		// If it's a successful response, return the data directly
		if (response.ok) {
			return responseData as T;
		}

		// If there's an error, throw an ApiError with backend's format
		throw new ApiError(
			responseData.code || 'UNKNOWN_ERROR',
			responseData.message || 'An unknown error occurred',
			responseData.payload
		);
	}

	/**
	 * Prepares the request body according to its type
	 */
	private prepareRequestBody(data: any): any {
		// If it's FormData, return as is
		if (data instanceof FormData) {
			return data;
		}

		// If it's undefined, return as is
		if (data === undefined) {
			return undefined;
		}

		// For other data types, convert to JSON
		return JSON.stringify(data);
	}

	/**
	 * Main API client with generic typing support
	 */
	private async request<T = any>(
		endpoint: string,
		options: ApiOptions = {},
		accessToken: string = ''
	): Promise<T> {
		try {
			const headers = this.createHeaders(options, accessToken);
			const url = `${this.baseUrl}${endpoint}`;

			const response = await fetch(url, {
				...options,
				headers
			});

			return this.handleResponse<T>(response);
		} catch (error) {
			// If it's a network error (not an API error)
			if (error instanceof Error && !(error instanceof ApiError)) {
				throw new ApiError('NETWORK_ERROR', error.message, { originalError: error.toString() });
			}
			// Re-throw if it's already an ApiError
			throw error;
		}
	}

	get<T = any>(endpoint: string, options?: ApiOptions, token?: string): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' }, token);
	}

	post<T = any, D = any>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				...options,
				method: 'POST',
				body: this.prepareRequestBody(data)
			},
			token
		);
	}

	put<T = any, D = any>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				...options,
				method: 'PUT',
				body: this.prepareRequestBody(data)
			},
			token
		);
	}

	patch<T = any, D = any>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				...options,
				method: 'PATCH',
				body: this.prepareRequestBody(data)
			},
			token
		);
	}

	delete<T = any, D = any>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				...options,
				method: 'DELETE',
				body: this.prepareRequestBody(data)
			},
			token
		);
	}

	_createUrl(endpoint: string): string {
		return `${this.baseUrl}${endpoint}`;
	}
}
