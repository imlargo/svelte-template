import type { Fetcher } from '@cloudflare/workers-types';
import type { User } from '#lib/types/user.js';
import type { RequirePermission } from '#lib/features/auth/guard.server.js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// `env` holds the bindings declared in wrangler.jsonc, typed with
		// @cloudflare/workers-types; the adapter types `ctx`, `caches` and `cf`.
		interface Platform {
			env: {
				ASSETS: Fetcher;
			};
		}

		interface Error {
			message: string;
			/** Set by `handleError` for unexpected errors, and logged alongside them. */
			errorId?: string;
		}
		interface Locals {
			/** Set by the auth hook. Absent on public routes and when auth is disabled. */
			user?: User | null;
			/** The refresh token stays in its cookie and never reaches locals or the client. */
			accessToken?: string | null;
			/**
			 * Throws 401 without a session, 403 without the permission. Always
			 * installed by the hook; call it at the top of every `+server.ts` handler
			 * and destructive form action.
			 */
			requirePermission: RequirePermission;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
