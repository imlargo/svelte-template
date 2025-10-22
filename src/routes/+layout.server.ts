import { authCookiesManager } from '$lib/server/cookies/manager';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, cookies }) => {
	const user = locals?.user || null;
	const { accessToken } = authCookiesManager.getTokens(cookies);

	return { user, accessToken };
}) satisfies LayoutServerLoad;
