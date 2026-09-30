import type { HandleClientError } from '@sveltejs/kit';
import { logger } from '$lib/core/logger';

// The client twin of the server's handleError: same safe message, same kind of
// id, so a report from the browser can be matched with its console line.
export const handleError: HandleClientError = ({ error, status }) => {
	if (status === 404) return { message: 'Not found.' };

	const errorId = createErrorId();
	return { message: logger.error('client', error, { errorId }), errorId };
};

/**
 * `crypto.randomUUID` exists only in secure contexts, and a dev server opened
 * over the LAN (`http://192.168…`) is not one. Without the fallback, the error
 * handler would throw and hide the error it was handling.
 */
function createErrorId(): string {
	if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
}
