import { building } from '$app/env';
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';
import { flag, unset } from '#lib/utils/env.js';

// The build gets a placeholder: on Workers the variables are set on the worker, not the build machine.
const apiUrl = z
	.string()
	.optional()
	.transform((value) => (building && value === undefined ? 'http://build.invalid' : value))
	.pipe(z.url());

export const variables = defineEnvVars({
	PUBLIC_API_URL: { public: true, schema: apiUrl },
	PUBLIC_AUTH_BASE_URL: {
		public: true,
		schema: unset(z.url().optional()),
		description: 'Only when auth lives on its own host; falls back to PUBLIC_API_URL.'
	},
	PUBLIC_AUTH_ENABLED: { public: true, schema: flag(true) },
	PUBLIC_AUTH_PASSWORD_ENABLED: { public: true, schema: flag(true) },
	PUBLIC_AUTH_GOOGLE_ENABLED: { public: true, schema: flag(false) },
	PUBLIC_AUTH_REFRESH_ENABLED: { public: true, schema: flag(false) },
	PUBLIC_GOOGLE_CLIENT_ID: { public: true, schema: unset(z.string().default('')) },

	AUTH_COOKIE_DOMAIN: { schema: unset(z.string().optional()) },
	AUTH_COOKIE_SECURE: { schema: flag(true) },
	AUTH_COOKIE_MAX_AGE: {
		schema: unset(
			z.coerce
				.number<string>()
				.int()
				.positive()
				.default(60 * 60 * 24 * 7)
		),
		description: 'Seconds. Defaults to 7 days.'
	},
	AUTH_COOKIE_SAMESITE: { schema: unset(z.enum(['lax', 'strict', 'none']).default('lax')) }
});
