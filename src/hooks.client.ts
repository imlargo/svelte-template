import type { HandleClientError } from '@sveltejs/kit';
import { logger } from '$lib/core/logger';

// The client twin of the server's handleError: same safe message, same kind of
// id, so a report from the browser can be matched with its console line.
export const handleError: HandleClientError = ({ error, status }) => {
	if (status === 404) return { message: 'Not found.' };

	const errorId = crypto.randomUUID();
	return { message: logger.error('client', error, { errorId }), errorId };
};
