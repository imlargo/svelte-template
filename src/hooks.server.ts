import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { config } from '#lib/config/app.js';
import { logger } from '#lib/core/logger.js';
import { handleAuth } from '#lib/features/auth/handler.server.js';

// With auth off there is no user to check against, so every permission passes.
// Installed anyway: `locals.requirePermission` is declared as always present,
// and a route guard must not be the thing that crashes when auth is disabled.
const handleWithoutAuth: Handle = ({ event, resolve }) => {
	event.locals.requirePermission = () => {};
	return resolve(event);
};

export const handle: Handle = config.auth.enabled ? handleAuth : handleWithoutAuth;

// Only unexpected errors reach this — an `error(403, ...)` never does. The
// visitor gets a message that is safe to show and an id to quote; the log gets
// the same id next to everything the message leaves out.
export const handleError: HandleServerError = ({ error, status }) => {
	// 404s are noise: they say more about crawlers than about the app.
	if (status === 404) return { message: 'Not found.' };

	const errorId = crypto.randomUUID();
	return { message: logger.error('server', error, { errorId }), errorId };
};
