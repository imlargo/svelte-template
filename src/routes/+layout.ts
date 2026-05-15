import { browser } from '$app/environment';
import { authStore } from '$lib/features/auth';
import type { LayoutLoad } from './$types';

export const load = (async ({ data }) => {
	const { user, accessToken, refreshToken } = data;

	if (browser) {
		if (user && accessToken && refreshToken) {
			try {
				authStore.login(accessToken, refreshToken, user);
			} catch {
				authStore.logout();
			}
		} else {
			authStore.logout();
		}
	}

	return { ...data };
}) satisfies LayoutLoad;
