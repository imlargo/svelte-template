import { AuthService } from '$lib/features/auth';
import { LoginSchema } from '$lib/features/auth/schemas';
import { serverAuthCookies } from '$lib/features/auth/server';
import { config } from '$lib/config';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';

function decodeRedirect(value: string | null): string | null {
	if (!value) return null;
	try {
		const decoded = atob(value);
		if (decoded.startsWith('/')) return decoded;
	} catch {
		// ignore malformed base64
	}
	return null;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	if (serverAuthCookies.isAuthenticated(cookies)) {
		const redirectTo = decodeRedirect(url.searchParams.get('redirect'));
		throw redirect(303, redirectTo ?? config.auth.defaultRedirectPath);
	}
	const form = await superValidate(zod(LoginSchema));
	return { form };
};

export const actions = {
	login: async ({ request, cookies, url }) => {
		const form = await superValidate(request, zod(LoginSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const auth = await new AuthService().login(form.data);
			serverAuthCookies.setTokens(cookies, auth.tokens.access_token, auth.tokens.refresh_token);
		} catch {
			return message(form, 'Invalid email or password.', { status: 401 });
		}

		const redirectTo = decodeRedirect(url.searchParams.get('redirect'));
		throw redirect(303, redirectTo ?? config.auth.defaultRedirectPath);
	}
} satisfies Actions;
