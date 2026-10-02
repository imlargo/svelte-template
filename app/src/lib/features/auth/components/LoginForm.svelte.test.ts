import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import LoginForm from './LoginForm.svelte';

// The reference component test: runs in a real Chromium tab (the `client`
// Vitest project), so what is asserted is what a user would see and do.
// .env.test pins the defaults: password sign-in on, Google off.

describe('LoginForm', () => {
	it('offers the password form and nothing that is disabled', async () => {
		const screen = await render(LoginForm);

		await expect.element(screen.getByLabelText('Email')).toBeVisible();
		await expect.element(screen.getByLabelText('Password')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Sign in with Google' }).query()).toBeNull();
	});

	it('shows why a previous sign-in failed', async () => {
		const screen = await render(LoginForm, {
			signInError: 'Could not sign you in. Please try again.'
		});

		await expect
			.element(screen.getByText('Could not sign you in. Please try again.'))
			.toBeVisible();
	});

	it('posts to an action that keeps where the user was headed', async () => {
		const screen = await render(LoginForm, { redirect: 'L2FkbWlu' });

		const form = screen.container.querySelector('form');
		expect(form?.getAttribute('action')).toBe('?/login&redirect=L2FkbWlu');
	});

	it('validates a field when the user leaves it', async () => {
		// Submitting is not covered here: `use:enhance` goes through SvelteKit's
		// router, which only exists in a real app (e2e/).
		const screen = await render(LoginForm);

		await screen.getByLabelText('Email').fill('not-an-email');
		await screen.getByLabelText('Password').click();

		await expect.element(screen.getByText('Please enter a valid email address.')).toBeVisible();
	});

	it('shows what the action rejected, keeping the email', async () => {
		const screen = await render(LoginForm, {
			form: { email: 'ada@example.com', errors: { password: ['Password is required.'] } }
		});

		await expect.element(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
		await expect.element(screen.getByText('Password is required.')).toBeVisible();
	});
});
