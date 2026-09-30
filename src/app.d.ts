import type { User } from '$lib/types/user';
import type { RequirePermission } from '$lib/features/auth/guard.server';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// `ctx`, `caches` and `cf` come from @sveltejs/adapter-cloudflare's own
		// ambient types. Only `env` is ours: its bindings are generated from
		// wrangler.jsonc by `pnpm run gen`.
		interface Platform {
			env: Env;
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
			 * Throws 403 unless the current user holds the permission (401 with no
			 * session). Always present: every request passes through the hook, which
			 * installs it before any route runs. Call it in `+layout.server.ts` to
			 * cover a page subtree, or at the top of a `+server.ts` handler.
			 */
			requirePermission: RequirePermission;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
