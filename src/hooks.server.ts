import type { Handle, HandleServerError } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { logger } from '$lib/core/logger';
import { handleAuth } from '$lib/features/auth/handler.server';

export const handle: Handle = config.auth.enabled
	? handleAuth
	: ({ event, resolve }) => resolve(event);

export const handleError: HandleServerError = ({ error, status }) => {
	// 404s are noise: they say more about crawlers than about the app.
	if (status === 404) return { message: 'Not found.' };
	return { message: logger.error('server', error) };
};
