/**
 * Creates a FormData object from a data object
 * Correctly handles different types of values (string, Blob, File)
 * @param data Object with the data for the FormData
 * @returns FormData object with the processed data
 */
export function toFormData(data: Record<string, unknown>): FormData {
	const formData = new FormData();

	Object.entries(data).forEach(([key, value]) => {
		// Ignore undefined or null values
		if (value === undefined || value === null) {
			return;
		}

		// Handle correctly the different types of values
		if (typeof value === 'string' || value instanceof Blob || value instanceof File) {
			formData.append(key, value);
		} else if (Array.isArray(value)) {
			// For arrays, add each element with the same key name
			value.forEach((item) => {
				if (item !== undefined && item !== null) {
					formData.append(key, item instanceof Blob || item instanceof File ? item : String(item));
				}
			});
		} else if (value instanceof Date) {
			// Convert dates to ISO string
			formData.append(key, value.toISOString());
		} else if (typeof value === 'object') {
			// For objects, convert to JSON
			formData.append(key, JSON.stringify(value));
		} else {
			// For other primitive types (number, boolean), convert to string
			formData.append(key, String(value));
		}
	});

	return formData;
}

export function toQueryParams<T extends Record<string, any>>(params: T): string {
	function convertToString(value: any): string {
		if (value === null || value === undefined) {
			return '';
		}

		if (typeof value === 'string') {
			return value;
		}

		if (value instanceof Date) {
			return value.toISOString();
		}

		if (typeof value === 'object' && !Array.isArray(value)) {
			return JSON.stringify(value);
		}

		return String(value);
	}

	const queryParts: string[] = [];

	for (const key in params) {
		if (!Object.prototype.hasOwnProperty.call(params, key)) {
			continue;
		}

		const value = params[key];
		if (value === null || value === undefined) {
			continue;
		}

		// Handle arrays with bracket notation
		if (Array.isArray(value)) {
			if (value.length === 0) {
				queryParts.push(`${encodeURIComponent(key)}[]=`);
			} else {
				for (const item of value as any[]) {
					if (item !== null && item !== undefined) {
						queryParts.push(
							`${encodeURIComponent(key)}[]=${encodeURIComponent(convertToString(item))}`
						);
					}
				}
			}
		} else {
			queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(convertToString(value))}`);
		}
	}

	return queryParts.join('&');
}

export function toCleanJSON(data: Record<string, any>): Record<string, any> {
	const cleanedData: Record<string, any> = {};

	for (const key in data) {
		if (Object.prototype.hasOwnProperty.call(data, key)) {
			const value = data[key];
			if (value !== undefined && value !== null && value !== '') {
				cleanedData[key] = value;
			}
		}
	}

	return cleanedData;
}
