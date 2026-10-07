import { error, fail, redirect } from '@sveltejs/kit';
import { config } from '#lib/config/app.js';
import { HOME_ROUTE } from '#lib/config/routes.js';
import { logger } from '#lib/core/logger.js';
import { AuthService } from '#lib/features/auth/services/auth.js';
import { LoginSchema, type LoginFailure } from '#lib/features/auth/schemas.js';
import { REDIRECT_PARAM, sanitizeRedirect } from '#lib/features/auth/redirect.js';
import {
	GOOGLE_AUTH_ORIGIN,
	OAUTH_FAILED_PARAM,
	buildGoogleAuthUrl
} from '#lib/features/auth/google.js';
import {
	getSession,
	isCredentialRejection,
	setOAuthState,
	setSession
} from '#lib/features/auth/session.server.js';
import { parseForm } from '#lib/utils/forms.js';
import type { Actions, PageServerLoad } from './$types';

/** Where to land after signing in, honouring the `?redirect=` the auth hook set. */
function destination(url: URL): string {
	return sanitizeRedirect(url.searchParams.get(REDIRECT_PARAM)) ?? HOME_ROUTE;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (getSession(cookies)) redirect(303, destination(url));

	return {
		redirect: url.searchParams.get(REDIRECT_PARAM),
		signInError: url.searchParams.has(OAUTH_FAILED_PARAM)
			? 'Could not sign you in. Please try again.'
			: null
	};
};

export const actions = {
	login: async ({ request, cookies, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const { data, errors } = parseForm(LoginSchema, formData);
		if (errors) return fail(400, { email, errors } satisfies LoginFailure);

		try {
			setSession(cookies, await new AuthService().login(data));
		} catch (err) {
			// Deliberately vague: saying which half was wrong enumerates accounts.
			if (isCredentialRejection(err)) {
				return fail(401, { email, message: 'Invalid email or password.' } satisfies LoginFailure);
			}
			logger.error('auth', err);
			return fail(503, {
				email,
				message: 'Cannot sign you in right now. Please try again in a moment.'
			} satisfies LoginFailure);
		}

		redirect(303, destination(url));
	},

	google: async ({ cookies, url }) => {
		if (!config.auth.methods.google.enabled) error(404, 'Google sign-in is not enabled.');

		const nonce = crypto.randomUUID();
		setOAuthState(cookies, { nonce, redirectTo: url.searchParams.get(REDIRECT_PARAM) });

		redirect(303, buildGoogleAuthUrl(url.origin, nonce), { external: [GOOGLE_AUTH_ORIGIN] });
	}
} satisfies Actions;
