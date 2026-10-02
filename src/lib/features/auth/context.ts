import { createContext } from 'svelte';
import type { ApiAuth } from '#lib/core/api.js';
import type { User } from '#lib/types/user.js';

/**
 * The client's auth state, in context — that is, per request. Never a
 * module-level `$state`: on the server that would be one user for everyone.
 */
export interface AuthState {
	readonly user: User | null;
	readonly accessToken: string | null;
	/** Credentials for a client-side service: `new UsersService(getAuth().api)`. */
	readonly api: ApiAuth;
}

/** Implemented by `ClientSession`, set once in the root layout. */
export const [getAuth, setAuth] = createContext<AuthState>();
