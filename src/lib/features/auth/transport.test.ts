import { describe, expect, it, vi } from 'vitest';
import type { Fetch } from '@imlargo/air';
import { createAuthTransport } from './transport';

/** A backend that accepts only `valid`, and counts what it was sent. */
function backend(valid: string) {
	const sent: Array<string | null> = [];
	const fetch: Fetch = async (_url, init) => {
		const auth = new Headers(init.headers).get('authorization');
		sent.push(auth);
		return new Response(null, { status: auth === `Bearer ${valid}` ? 200 : 401 });
	};
	return { fetch, sent };
}

const withToken = (token: string): RequestInit => ({
	headers: { Authorization: `Bearer ${token}` }
});

describe('createAuthTransport without renewal', () => {
	it('passes a successful response through untouched', async () => {
		const api = backend('good');
		const onUnauthorized = vi.fn(async () => {});
		const transport = createAuthTransport({ onUnauthorized, fetch: api.fetch });

		const response = await transport('/users', withToken('good'));

		expect(response.status).toBe(200);
		expect(onUnauthorized).not.toHaveBeenCalled();
	});

	it('hands a 401 to onUnauthorized and still returns it to the caller', async () => {
		const api = backend('good');
		const onUnauthorized = vi.fn(async () => {});
		const transport = createAuthTransport({ onUnauthorized, fetch: api.fetch });

		const response = await transport('/users', withToken('stale'));

		// The caller still gets its error; the redirect is not a substitute for it.
		expect(response.status).toBe(401);
		expect(onUnauthorized).toHaveBeenCalledOnce();
	});

	it('runs onUnauthorized once for a burst of 401s', async () => {
		const api = backend('good');
		const onUnauthorized = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 10)));
		const transport = createAuthTransport({ onUnauthorized, fetch: api.fetch });

		await Promise.all([1, 2, 3].map(() => transport('/users', withToken('stale'))));

		expect(onUnauthorized).toHaveBeenCalledOnce();
	});
});

describe('createAuthTransport with renewal', () => {
	it('renews, re-sends with the new token, and never reports the 401', async () => {
		const api = backend('fresh');
		const onUnauthorized = vi.fn(async () => {});
		const renew = vi.fn(async () => 'fresh');
		const transport = createAuthTransport({ onUnauthorized, renew, fetch: api.fetch });

		const response = await transport('/users', withToken('stale'));

		expect(response.status).toBe(200);
		expect(api.sent).toEqual(['Bearer stale', 'Bearer fresh']);
		expect(onUnauthorized).not.toHaveBeenCalled();
	});

	it('renews once for requests that fail together', async () => {
		const api = backend('fresh');
		const renew = vi.fn(async () => 'fresh');
		const transport = createAuthTransport({
			onUnauthorized: async () => {},
			renew,
			fetch: api.fetch
		});

		const responses = await Promise.all(
			[1, 2, 3].map(() => transport('/users', withToken('stale')))
		);

		expect(renew).toHaveBeenCalledOnce();
		expect(responses.map((r) => r.status)).toEqual([200, 200, 200]);
	});

	it('falls back to onUnauthorized when the session cannot be renewed', async () => {
		const api = backend('fresh');
		const onUnauthorized = vi.fn(async () => {});
		const transport = createAuthTransport({
			onUnauthorized,
			renew: async () => null,
			fetch: api.fetch
		});

		const response = await transport('/users', withToken('stale'));

		expect(response.status).toBe(401);
		expect(onUnauthorized).toHaveBeenCalledOnce();
	});

	it('gives the renewal the underlying fetch, not the wrapped one', async () => {
		// Renewing through the wrapped transport would wait on its own refresh.
		const api = backend('fresh');
		let received: Fetch | null = null;
		const transport = createAuthTransport({
			onUnauthorized: async () => {},
			renew: async (fetch) => {
				received = fetch;
				return 'fresh';
			},
			fetch: api.fetch
		});

		await transport('/users', withToken('stale'));

		expect(received).toBe(api.fetch);
	});
});
