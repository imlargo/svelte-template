import type { HandleClientError } from '@sveltejs/kit/hooks';
import { logger } from '#lib/core/logger.js';

// The client twin of the server's handleError: same safe message, same kind of
// id, so a report from the browser can be matched with its console line.
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind !== 'unknown') return;

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
