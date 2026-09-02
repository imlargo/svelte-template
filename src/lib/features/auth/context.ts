/**
 * The auth state of the client, hung off the component tree — that is, off the
 * request. Never a module-level `$state`: in SSR modules are singletons per
 * process, so that would leak one user's data into another user's page.
 */
import { createContext } from 'svelte';
import type { User } from '$lib/types/user';

export interface AuthState {
	user: User | null;
	accessToken: string | null;
}

/**
 * Holds a getter rather than a value, so reactivity crosses the context
 * boundary and services read the current token after every navigation:
 *
 *   const auth = getAuth();
 *   const users = new UsersService(() => auth().accessToken);
 */
export const [getAuth, setAuth] = createContext<() => AuthState>();
