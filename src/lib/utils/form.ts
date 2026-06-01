export function toFormData(data: Record<string, unknown>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined || value === null) continue;
		if (typeof value === 'string' || value instanceof Blob || value instanceof File) {
			formData.append(key, value);
		} else if (Array.isArray(value)) {
			for (const item of value) {
				if (item !== undefined && item !== null) {
					formData.append(key, item instanceof Blob || item instanceof File ? item : String(item));
				}
			}
		} else if (value instanceof Date) {
			formData.append(key, value.toISOString());
		} else if (typeof value === 'object') {
			formData.append(key, JSON.stringify(value));
		} else {
			formData.append(key, String(value));
		}
	}
	return formData;
}

export function toQueryParams<T extends Record<string, unknown>>(params: T): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(params)) {
		if (value === null || value === undefined) continue;
		if (Array.isArray(value)) {
			if (value.length === 0) {
				parts.push(`${encodeURIComponent(key)}[]=`);
			} else {
				for (const item of value) {
					if (item !== null && item !== undefined) {
						parts.push(
							`${encodeURIComponent(key)}[]=${encodeURIComponent(value instanceof Date ? value.toISOString() : String(item))}`
						);
					}
				}
			}
		} else {
			const str =
				value instanceof Date
					? value.toISOString()
					: typeof value === 'object'
						? JSON.stringify(value)
						: String(value);
			parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(str)}`);
		}
	}
	return parts.join('&');
}

export function toCleanJSON(data: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		if (value !== undefined && value !== null && value !== '') {
			result[key] = value;
		}
	}
	return result;
}
