import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { config } from '$lib/config/app';
import { HOME_ROUTE } from '$lib/config/routes';
import { AuthService } from '$lib/features/auth/services/auth';
import { LoginSchema } from '$lib/features/auth/schemas';
import { REDIRECT_PARAM, decodeRedirect } from '$lib/features/auth/redirect';
import { OAUTH_FAILED_PARAM, buildGoogleAuthUrl } from '$lib/features/auth/google';
import { getSession, setOAuthState, setSession } from '$lib/features/auth/session.server';
import type { Actions, PageServerLoad } from './$types';

/** Where to land after signing in, honouring the `?redirect=` the auth hook set. */
function destination(url: URL): string {
	return decodeRedirect(url.searchParams.get(REDIRECT_PARAM)) ?? HOME_ROUTE;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (getSession(cookies)) redirect(303, destination(url));

	return {
		form: await superValidate(zod4(LoginSchema)),
		redirect: url.searchParams.get(REDIRECT_PARAM),
		signInError: url.searchParams.has(OAUTH_FAILED_PARAM)
			? 'Could not sign you in. Please try again.'
			: null
	};
};

export const actions = {
	login: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod4(LoginSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const { tokens } = await new AuthService().login(form.data);
			setSession(cookies, {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token
			});
		} catch {
			// Deliberately vague: telling them which half was wrong enumerates accounts.
			return message(form, 'Invalid email or password.', { status: 401 });
		}

		redirect(303, destination(url));
	},

	google: async ({ cookies, url }) => {
		if (!config.auth.methods.google.enabled) error(404, 'Google sign-in is not enabled.');

		const nonce = crypto.randomUUID();
		setOAuthState(cookies, { nonce, redirectTo: url.searchParams.get(REDIRECT_PARAM) });

		redirect(303, buildGoogleAuthUrl(url.origin, nonce));
	}
} satisfies Actions;
