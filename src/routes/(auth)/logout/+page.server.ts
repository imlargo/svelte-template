import { redirect } from '@sveltejs/kit';
import { AUTH_ROUTES } from '#lib/config/routes.js';
import { clearSession } from '#lib/features/auth/session.server.js';
import type { Actions } from './$types';

// An action, not a `load`: a GET would let link prefetching, or an injected
// `<img src="/logout">`, sign the user out.
export const actions = {
	default: async ({ cookies }) => {
		clearSession(cookies);
		redirect(303, AUTH_ROUTES.login);
	}
} satisfies Actions;
