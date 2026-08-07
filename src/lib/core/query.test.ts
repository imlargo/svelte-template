import { describe, expect, it } from 'vitest';
import { createQuery } from './query.svelte';
import { ApiError } from './errors';

describe('Query', () => {
	it('starts empty and idle', () => {
		const query = createQuery<string[]>();

		expect(query.data).toBe(null);
		expect(query.error).toBe(null);
		expect(query.isLoading).toBe(false);
	});

	it('holds the resolved data', async () => {
		const query = createQuery<string[]>();

		await query.run(async () => ['a', 'b']);

		expect(query.data).toEqual(['a', 'b']);
		expect(query.error).toBe(null);
		expect(query.isLoading).toBe(false);
	});

	it('exposes the normalized error object, not a string', async () => {
		const query = createQuery<string[]>();

		await query.run(async () => {
			throw new ApiError(404, 'NOT_FOUND', 'No existe');
		});

		expect(query.error).toBeInstanceOf(ApiError);
		expect(query.error?.code).toBe('NOT_FOUND');
		expect(query.error?.getMessage()).toBe('No existe');
		expect(query.isLoading).toBe(false);
	});

	it('clears a previous error on the next run', async () => {
		const query = createQuery<string>();
		await query.run(async () => {
			throw new Error('boom');
		});
		expect(query.error).not.toBe(null);

		await query.run(async () => 'ok');

		expect(query.error).toBe(null);
		expect(query.data).toBe('ok');
	});

	it('is loading while the call is in flight', async () => {
		const query = createQuery<string>();

		const pending = query.run(async () => 'value');
		expect(query.isLoading).toBe(true);

		await pending;
		expect(query.isLoading).toBe(false);
	});
});
