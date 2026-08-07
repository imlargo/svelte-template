import { describe, expect, it } from 'vitest';
import { isHttpError } from '@sveltejs/kit';

/**
 * Pages and endpoints fail in opposite directions, and this test covers the
 * dangerous one.
 *
 * A page left out of AUTH_ROUTE_PERMISSIONS is denied — the hook has a table to
 * miss it in. An endpoint has no such table by design: it authorizes itself, so
 * a handler that forgets `locals.requirePermission` is open to any signed-in
 * user, and nothing in lint, types or the hook can notice.
 *
 * So the check lives here: every HTTP method every endpoint exports must refuse
 * a request whose guard refuses. Adding an unguarded handler turns this red.
 */

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'] as const;

const endpoints = import.meta.glob('./**/+server.ts', { eager: true }) as Record<
	string,
	Record<string, unknown>
>;

/** Stands in for a user the guard rejects — every permission check throws 403. */
function deniedEvent() {
	return {
		url: new URL('http://localhost/api/test'),
		params: { id: '1' },
		request: new Request('http://localhost/api/test', { method: 'POST', body: '{}' }),
		locals: {
			requirePermission: () => {
				throw { status: 403, body: { message: 'denied' } };
			}
		}
	};
}

describe('every /api endpoint guards itself', () => {
	it('finds the endpoint modules at all', () => {
		// Guards the guard: a broken glob would make every case below vacuous.
		expect(Object.keys(endpoints).length).toBeGreaterThan(0);
	});

	const cases = Object.entries(endpoints).flatMap(([path, module]) =>
		HTTP_METHODS.filter((method) => typeof module[method] === 'function').map(
			(method) => [path, method, module[method] as (event: unknown) => unknown] as const
		)
	);

	it.each(cases)('%s %s refuses when the guard refuses', async (_path, _method, handler) => {
		// Either it throws the guard's own rejection, or it never called the
		// guard — in which case it answered without checking anything.
		await expect(handler(deniedEvent())).rejects.toSatisfy(
			(err: unknown) => isHttpError(err) || (err as { status?: number })?.status === 403
		);
	});
});
