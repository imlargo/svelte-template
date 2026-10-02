import type { LayoutServerLoad } from './$types';

// Serialized into the page: the access token for client-side services, never
// the refresh token, which only the server spends.
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null
	};
};
