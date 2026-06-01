import type { User } from '$lib/types/auth/user';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by the auth handler when auth.enabled = true. Null when auth is disabled or user is not logged in. */
			user?: User | null;
			accessToken?: string | null;
			refreshToken?: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
