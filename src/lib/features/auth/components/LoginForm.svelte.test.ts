import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { defaults } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import LoginForm from './LoginForm.svelte';
import { LoginSchema } from '$lib/features/auth/schemas';

// The reference component test: runs in a real Chromium tab (the `client`
// Vitest project), so what is asserted is what a user would see and do.
// .env.test pins the defaults: password sign-in on, Google off.

function emptyForm() {
	return defaults(zod4(LoginSchema));
}

describe('LoginForm', () => {
	it('offers the password form and nothing that is disabled', async () => {
		const screen = await render(LoginForm, { form: emptyForm() });

		await expect.element(screen.getByLabelText('Email')).toBeVisible();
		await expect.element(screen.getByLabelText('Password')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Sign in with Google' }).query()).toBeNull();
	});

	it('shows why a previous sign-in failed', async () => {
		const screen = await render(LoginForm, {
			form: emptyForm(),
			signInError: 'Could not sign you in. Please try again.'
		});

		await expect
			.element(screen.getByText('Could not sign you in. Please try again.'))
			.toBeVisible();
	});

	it('validates a field when the user leaves it', async () => {
		// Submitting is not covered here: superforms' submit goes through
		// SvelteKit's router, which only exists in a real app (e2e/).
		const screen = await render(LoginForm, { form: emptyForm() });

		await screen.getByLabelText('Email').fill('not-an-email');
		await screen.getByLabelText('Password').click();

		await expect.element(screen.getByText('Please enter a valid email address.')).toBeVisible();
	});
});
