import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null,
		refreshToken: locals.refreshToken ?? null
	};
}) satisfies LayoutServerLoad;
