import { AuthService } from '$lib/features/auth';
import { RegisterSchema } from '$lib/features/auth/schemas';
import { serverAuthCookies } from '$lib/features/auth/server';
import { config } from '$lib/config';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	if (serverAuthCookies.isAuthenticated(cookies)) {
		throw redirect(303, config.auth.defaultRedirectPath);
	}
	const form = await superValidate(zod(RegisterSchema));
	return { form };
};

export const actions = {
	register: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(RegisterSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const { name, email, password } = form.data;
			const auth = await new AuthService().register({ name, email, password });
			serverAuthCookies.setTokens(cookies, auth.tokens.access_token, auth.tokens.refresh_token);
		} catch {
			return message(form, 'Could not create account. Please try again.', { status: 400 });
		}

		throw redirect(303, config.auth.defaultRedirectPath);
	}
} satisfies Actions;
