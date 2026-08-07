import { redirect } from '@sveltejs/kit';
import { config } from '$lib/config/app';
import { clearSession } from '$lib/features/auth/session.server';
import type { Actions } from './$types';

/**
 * POST only. As a `load` this ran on GET, so SvelteKit's link prefetch — or an
 * injected `<img src="/logout">` — signed the user out on its own.
 */
export const actions = {
	default: async ({ cookies }) => {
		clearSession(cookies);
		redirect(303, config.auth.loginPath);
	}
} satisfies Actions;
