import { authCookies } from '$lib/features/auth';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	authCookies.clearTokens(cookies);
	redirect(303, '/login');
}) satisfies PageServerLoad;
