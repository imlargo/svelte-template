import { describe, expect, it } from 'vitest';
import { ListQuery } from './list-query.svelte';

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => (resolve = res));
	return { promise, resolve };
}

describe('ListQuery', () => {
	it('starts stale, before anything has been asked for', () => {
		expect(new ListQuery<string>().isStale).toBe(true);
	});

	it('is no longer stale once its own response lands', async () => {
		const list = new ListQuery<string>();

		await list.load({ page: 1 }, async () => 'page 1');

		expect(list.isStale).toBe(false);
		expect(list.data).toBe('page 1');
	});

	it('is stale while a different list is on its way', () => {
		const list = new ListQuery<string>();

		list.load({ page: 2 }, () => deferred<string>().promise);

		expect(list.isStale).toBe(true);
	});

	it('keeps the table when the same filters are refetched', async () => {
		const list = new ListQuery<string>();
		await list.load({ page: 1 }, async () => 'page 1');

		const pending = deferred<string>();
		list.load({ page: 1 }, () => pending.promise);

		expect(list.isStale).toBe(false);
		expect(list.isLoading).toBe(true);

		pending.resolve('page 1 again');
	});

	it('recovers when a superseded response lands last', async () => {
		const list = new ListQuery<string>();
		const slow = deferred<string>();
		const fast = deferred<string>();

		const third = list.load({ page: 3 }, () => slow.promise);
		const fourth = list.load({ page: 4 }, () => fast.promise);

		fast.resolve('page 4');
		await fourth;
		expect(list.isStale).toBe(false);

		// Page 3 arrives late. Letting it claim the screen would leave the
		// rendered key behind the requested one with nothing in flight to catch up.
		slow.resolve('page 3');
		await third;

		expect(list.isStale).toBe(false);
		expect(list.data).toBe('page 4');
	});
});
