import { normalizeError } from '$lib/core/errors';
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, status }) => {
	const err = normalizeError(error);
	if (status !== 404) console.error('[client error]', err);
	return { message: err.getMessage() };
};
