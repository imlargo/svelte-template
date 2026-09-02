import type { LayoutServerLoad } from './$types';

/**
 * Everything returned here is serialized into the page payload. The access
 * token goes out because client-side services need it; the refresh token never
 * does — it's stored for a future refresh flow and has no reader yet.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null
	};
};
