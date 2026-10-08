import { describe, expect, it } from 'vitest';
import { Query } from './query.svelte';
import { AppError } from '#lib/core/errors.js';

describe('Query', () => {
	it('aborts the run it supersedes', async () => {
		const query = new Query<string>();
		let first: AbortSignal | undefined;

		query.run((signal) => {
			first = signal;
			return new Promise(() => {});
		});
		await query.run(async () => 'second');

		expect(first?.aborted).toBe(true);
		expect(query.data).toBe('second');
	});

	it('starts empty and idle', () => {
		const query = new Query<string[]>();

		expect(query.data).toBe(null);
		expect(query.error).toBe(null);
		expect(query.isLoading).toBe(false);
	});

	it('holds the resolved data', async () => {
		const query = new Query<string[]>();

		await query.run(async () => ['a', 'b']);

		expect(query.data).toEqual(['a', 'b']);
		expect(query.error).toBe(null);
		expect(query.isLoading).toBe(false);
	});

	it('exposes the normalized error object, not a string', async () => {
		const query = new Query<string[]>();

		await query.run(async () => {
			throw new AppError('NOT_FOUND', 'No existe');
		});

		expect(query.error).toBeInstanceOf(AppError);
		expect(query.error?.code).toBe('NOT_FOUND');
		expect(query.error?.message).toBe('No existe');
		expect(query.isLoading).toBe(false);
	});

	it('clears a previous error on the next run', async () => {
		const query = new Query<string>();
		await query.run(async () => {
			throw new Error('boom');
		});
		expect(query.error).not.toBe(null);

		await query.run(async () => 'ok');

		expect(query.error).toBe(null);
		expect(query.data).toBe('ok');
	});

	it('keeps the previous data when a run fails', async () => {
		const query = new Query<string>();
		await query.run(async () => 'first');

		await query.run(async () => {
			throw new Error('boom');
		});

		expect(query.data).toBe('first');
		expect(query.error).not.toBe(null);
	});

	it('ignores an older run that settles after a newer one', async () => {
		const query = new Query<string>();
		let settleSlow!: (value: string) => void;

		const slow = query.run(() => new Promise<string>((resolve) => (settleSlow = resolve)));
		await query.run(async () => 'fast');
		settleSlow('stale');
		await slow;

		expect(query.data).toBe('fast');
		expect(query.isLoading).toBe(false);
	});

	it('is loading until the latest run settles', async () => {
		const query = new Query<string>();
		let settleSlow!: (value: string) => void;

		await query.run(async () => 'first');
		const slow = query.run(() => new Promise<string>((resolve) => (settleSlow = resolve)));
		expect(query.isLoading).toBe(true);

		settleSlow('second');
		await slow;
		expect(query.isLoading).toBe(false);
	});

	it('is loading while the call is in flight', async () => {
		const query = new Query<string>();

		const pending = query.run(async () => 'value');
		expect(query.isLoading).toBe(true);

		await pending;
		expect(query.isLoading).toBe(false);
	});
});
