import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Boundary from './Boundary.svelte';
import { AppError } from '#lib/core/errors.js';

// What a crashing section shows is what the app's error rules allow: an
// expected error's own message, and never the text of a bug.

const { logError } = vi.hoisted(() => ({ logError: vi.fn(() => 'logged') }));

vi.mock('#lib/core/logger.js', () => ({
	logger: { error: logError, warn: vi.fn(), info: vi.fn() }
}));

/** A child that throws while rendering, which is what a boundary catches. */
function throwing(error: unknown) {
	return createRawSnippet(() => ({
		render: () => {
			throw error;
		}
	}));
}

describe('Boundary', () => {
	it('renders its children when nothing goes wrong', async () => {
		const screen = await render(Boundary, {
			children: createRawSnippet(() => ({ render: () => '<p>All good</p>' }))
		});

		await expect.element(screen.getByText('All good')).toBeVisible();
	});

	it('shows an expected error by its own message, and offers a retry', async () => {
		const screen = await render(Boundary, {
			children: throwing(new AppError('NOT_FOUND', 'This report no longer exists.'))
		});

		await expect.element(screen.getByText('This report no longer exists.')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
	});

	it('never shows the text of a bug, and logs it instead', async () => {
		const screen = await render(Boundary, {
			children: throwing(new TypeError('Cannot read properties of undefined'))
		});

		await expect.element(screen.getByText('An unexpected error occurred.')).toBeVisible();
		expect(screen.getByText('Cannot read properties of undefined').query()).toBeNull();
		expect(logError).toHaveBeenCalledWith('ui', expect.any(TypeError));
	});
});
