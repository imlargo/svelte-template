import { ApiError } from '$lib/core/errors';

export interface ApiOptions extends RequestInit {
	headers?: HeadersInit;
}

export type ApiClientOptions = {
	baseUrl: string;
	/** Optional static token used for every request. */
	defaultToken?: string;
	/**
	 * Optional callback that returns the current auth token dynamically.
	 * Takes precedence over `defaultToken`.
	 */
	getToken?: () => string | null;
};

export class ApiClient {
	private baseUrl: string;
	private defaultToken: string;
	private getToken?: () => string | null;

	constructor(options: ApiClientOptions) {
		this.baseUrl = options.baseUrl;
		this.defaultToken = options.defaultToken ?? '';
		this.getToken = options.getToken;
	}

	private resolveToken(perRequestToken?: string): string {
		if (perRequestToken) return perRequestToken;
		if (this.getToken) return this.getToken() ?? '';
		return this.defaultToken;
	}

	private buildHeaders(options: ApiOptions, token: string): HeadersInit {
		const isFormData = options.body instanceof FormData;
		return {
			...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers
		};
	}

	private async handleResponse<T>(response: Response): Promise<T> {
		const data = await response.json();
		if (response.ok) return data as T;
		throw new ApiError(
			(data.code as number) ?? 0,
			(data.status as string) ?? 'UNKNOWN_ERROR',
			data.message ?? 'An unknown error occurred',
			data.payload
		);
	}

	private serializeBody(data: unknown): BodyInit | undefined {
		if (data === undefined) return undefined;
		if (data instanceof FormData) return data;
		return JSON.stringify(data);
	}

	private async request<T>(endpoint: string, options: ApiOptions, token?: string): Promise<T> {
		try {
			const resolvedToken = this.resolveToken(token);
			const headers = this.buildHeaders(options, resolvedToken);
			const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
			return this.handleResponse<T>(response);
		} catch (error) {
			if (error instanceof ApiError) throw error;
			const msg = error instanceof Error ? error.message : String(error);
			throw new ApiError(0, 'NETWORK_ERROR', msg, {
				originalError: error instanceof Error ? error.name : String(error)
			});
		}
	}

	get<T>(endpoint: string, options?: ApiOptions, token?: string): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' }, token);
	}

	post<T, D = unknown>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{ ...options, method: 'POST', body: this.serializeBody(data) },
			token
		);
	}

	put<T, D = unknown>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{ ...options, method: 'PUT', body: this.serializeBody(data) },
			token
		);
	}

	patch<T, D = unknown>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{ ...options, method: 'PATCH', body: this.serializeBody(data) },
			token
		);
	}

	delete<T, D = unknown>(
		endpoint: string,
		data?: D,
		options?: ApiOptions,
		token?: string
	): Promise<T> {
		return this.request<T>(
			endpoint,
			{ ...options, method: 'DELETE', body: this.serializeBody(data) },
			token
		);
	}

	createUrl(endpoint: string): string {
		return `${this.baseUrl}${endpoint}`;
	}
}
