import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { config } from '#lib/config/app.js';
import { logger } from '#lib/core/logger.js';
import { handleAuth } from '#lib/features/auth/handler.server.js';

// Auth off: `locals.requirePermission` is declared as always present, so it must still exist.
const handleWithoutAuth: Handle = ({ event, resolve }) => {
	event.locals.requirePermission = () => {};
	return resolve(event);
};

export const handle: Handle = config.auth.enabled ? handleAuth : handleWithoutAuth;

// Only unknown errors need handling: `error(403, ...)` already carries its message.
// The visitor gets a safe message and an id; the log gets the same id with the rest.
export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind !== 'unknown') return;

	const errorId = crypto.randomUUID();
	return { message: logger.error('server', error, { errorId }), errorId };
};
