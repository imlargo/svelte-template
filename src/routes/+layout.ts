import { browser } from '$app/environment';
import type { User } from '$lib/domain/models';
import { authStore } from '$lib/features/auth/stores/auth.svelte';
import type { LayoutLoad } from './$types';

export const load = (async ({ data }) => {
	const user: User | null = data?.user || null;
	const accessToken: string | any = data?.accessToken;

	if (browser) {
		if (user == null || accessToken == null) {
			authStore.logout();
		} else {
			authStore.login(accessToken, accessToken, user);
		}
	}

	return {
		...data
	};
}) satisfies LayoutLoad;
