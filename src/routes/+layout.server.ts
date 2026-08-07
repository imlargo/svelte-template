import type { LayoutServerLoad } from './$types';

/**
 * Everything returned here is serialized into the page payload. The access
 * token goes out because client-side services need it; the refresh token never
 * does — see docs/ARCHITECTURE.md §7.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null
	};
};
