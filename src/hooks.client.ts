import type { HandleClientError } from '@sveltejs/kit';
import { logError } from '$lib/core/logger';

export const handleError: HandleClientError = ({ error, status }) => {
	if (status === 404) return { message: 'Not found.' };
	return { message: logError('client', error) };
};
