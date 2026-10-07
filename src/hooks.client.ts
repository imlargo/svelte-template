import type { ClientInit, HandleClientError } from '@sveltejs/kit/hooks';
import { parseErrorBody } from '#lib/config/errors.js';
import { setErrorBodyParser } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';

export const init: ClientInit = () => {
	setErrorBodyParser(parseErrorBody);
};

// Same contract as the server's handleError, so a browser report matches its console line.
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind !== 'unknown') return;

	const errorId = createErrorId();
	return { message: logger.error('client', error, { errorId }), errorId };
};

/** `crypto.randomUUID` needs a secure context, and a dev server over the LAN is not one. */
function createErrorId(): string {
	if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
	return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
		byte.toString(16).padStart(2, '0')
	).join('');
}
