import type { Handle, HandleServerError } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { logger } from '$lib/core/logger';
import { handleAuth } from '$lib/features/auth/handler.server';

// With auth off there is no user to check against, so every permission passes.
// Installed anyway: `locals.requirePermission` is declared as always present,
// and a route guard must not be the thing that crashes when auth is disabled.
const handleWithoutAuth: Handle = ({ event, resolve }) => {
	event.locals.requirePermission = () => {};
	return resolve(event);
};

export const handle: Handle = config.auth.enabled ? handleAuth : handleWithoutAuth;

export const handleError: HandleServerError = ({ error, status }) => {
	// 404s are noise: they say more about crawlers than about the app.
	if (status === 404) return { message: 'Not found.' };
	return { message: logger.error('server', error) };
};
