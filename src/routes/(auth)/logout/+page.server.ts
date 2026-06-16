import { serverAuthCookies } from '$lib/features/auth/server';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	serverAuthCookies.clearTokens(cookies);
	redirect(303, '/login');
}) satisfies PageServerLoad;
