import type { LayoutServerLoad } from './$types';

// The access token reaches the client for its services; the refresh token never does.
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null
	};
};
