import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { config } from '#lib/config/app.js';
import { parseErrorBody } from '#lib/config/errors.js';
import { setErrorBodyParser } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';
import { handleAuth } from '#lib/features/auth/hook.server.js';
import { UserRole, type User } from '#lib/types/user.js';

// Where core learns the project's choices: the error parser here, a logger if you add one.
export const init: ServerInit = () => {
	setErrorBodyParser(parseErrorBody);
};

/** Who acts with `PUBLIC_AUTH_ENABLED=false`: an admin that exists only in this process. */
const LOCAL_USER: User = {
	id: 'local',
	email: 'local@localhost',
	name: 'Local user',
	role: UserRole.ADMIN,
	avatar: null,
	created_at: new Date(0).toISOString(),
	updated_at: new Date(0).toISOString()
};

// Auth off: the guard still exists and still answers an actor, so handlers do not branch on it.
const handleWithoutAuth: Handle = ({ event, resolve }) => {
	event.locals.user = LOCAL_USER;
	event.locals.requirePermission = () => LOCAL_USER;
	return resolve(event);
};

export const handle: Handle = config.auth.enabled ? handleAuth : handleWithoutAuth;

const NOT_FOUND_MESSAGE = 'This page does not exist, or it moved.';

// A 404 gets a sentence instead of "Not Found". Only unknown errors need handling: `error(403, ...)` already carries its message.
// The visitor gets a safe message and an id; the log gets the same id with the rest.
export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind === 'framework' && error.status === 404) return { message: NOT_FOUND_MESSAGE };
	if (kind !== 'unknown') return;

	const errorId = crypto.randomUUID();
	return { message: logger.error('server', error, { errorId }), errorId };
};
