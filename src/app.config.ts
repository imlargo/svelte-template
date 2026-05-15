/**
 * Application configuration entry point.
 *
 * Override any defaults here. All fields are optional — the project works
 * out of the box without a single .env variable.
 *
 * Read env variables from $env/dynamic/public (client-safe) or
 * $env/dynamic/private (server-only, import only in server files) and pass
 * them into defineConfig(). This keeps config centralized and makes env
 * usage explicit and auditable.
 */
import { defineConfig } from '$lib/config';
import { env } from '$env/dynamic/public';

export default defineConfig({
	api: {
		baseUrl: env.PUBLIC_BACKEND_BASE_URL ?? ''
	},
	auth: {
		enabled: true,
		googleClientId: env.PUBLIC_GOOGLE_CLIENT_ID ?? ''
	}
});
