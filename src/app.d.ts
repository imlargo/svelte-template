import type { User } from '#lib/types/user.js';
import type { RequirePermission } from '#lib/features/auth/guard.server.js';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Error {
			/** Set by `handleError` for unexpected errors, and logged alongside them. */
			errorId?: string;
		}

		interface Locals {
			/** Set by the auth hook. Absent on public routes; a local stand-in when auth is disabled. */
			user?: User | null;
			/** The refresh token stays in its cookie and never reaches locals or the client. */
			accessToken?: string | null;
			/** 401 without a session, 403 without the permission; answers the actor. Call it in every endpoint handler and destructive action. */
			requirePermission: RequirePermission;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
