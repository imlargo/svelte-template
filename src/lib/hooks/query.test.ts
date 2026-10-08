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

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => (resolve = res));
	return { promise, resolve };
}

describe('Query.isStale', () => {
	it('is stale before anything has been asked for', () => {
		expect(new Query<string>().isStale).toBe(true);
	});

	it('is no longer stale once its own response lands', async () => {
		const query = new Query<string>();

		await query.run(async () => 'page 1', { page: 1 });

		expect(query.isStale).toBe(false);
	});

	it('is stale while different params are on their way', async () => {
		const query = new Query<string>();
		await query.run(async () => 'page 1', { page: 1 });

		query.run(() => deferred<string>().promise, { page: 2 });

		expect(query.isStale).toBe(true);
	});

	it('keeps the rows when the same params are refetched', async () => {
		const query = new Query<string>();
		await query.run(async () => 'page 1', { page: 1 });

		query.run(() => deferred<string>().promise, { page: 1 });

		expect(query.isStale).toBe(false);
		expect(query.isLoading).toBe(true);
	});

	it('recovers when a superseded response lands last', async () => {
		const query = new Query<string>();
		const slow = deferred<string>();
		const fast = deferred<string>();

		const third = query.run(() => slow.promise, { page: 3 });
		const fourth = query.run(() => fast.promise, { page: 4 });

		fast.resolve('page 4');
		await fourth;
		slow.resolve('page 3');
		await third;

		expect(query.isStale).toBe(false);
		expect(query.data).toBe('page 4');
	});
});
