/**
 * The auth state of the client, hung off the component tree — that is, off the
 * request. Never a module-level `$state`: in SSR modules are singletons per
 * process, so that would leak one user's data into another user's page.
 */
import { createContext } from 'svelte';
import type { ApiAuth } from '$lib/core/api';
import type { User } from '$lib/types/user';

export interface AuthState {
	readonly user: User | null;
	readonly accessToken: string | null;
	/**
	 * What a client-side service needs to call the API as this user. The token
	 * is read per request, so a renewed one is picked up, and a 401 sends the
	 * user back to sign in:
	 *
	 *   const users = new UsersService(getAuth().api);
	 */
	readonly api: ApiAuth;
}

/** Implemented by `ClientSession`, set once in the root layout. */
export const [getAuth, setAuth] = createContext<AuthState>();
