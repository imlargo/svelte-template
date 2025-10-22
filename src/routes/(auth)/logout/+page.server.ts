import { authCookiesManager } from '$lib/server/cookies/manager';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	authCookiesManager.logout(cookies);
	redirect(303, '/login');
}) satisfies PageServerLoad;
