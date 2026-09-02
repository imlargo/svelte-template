import { describe, expect, it } from 'vitest';
import { AirError } from '@korastd/air';
import { AppError, normalizeError } from './errors';

/** An AirError as air builds it: `status` comes from the response, not the init. */
function airError(body: unknown, httpStatus?: number): AirError {
	return new AirError(
		'Request failed',
		{
			url: 'https://api.test/users/1',
			method: 'GET',
			headers: new Headers({ authorization: 'Bearer secret' }),
			options: {}
		},
		{
			data: body,
			response: httpStatus === undefined ? undefined : new Response(null, { status: httpStatus })
		}
	);
}

describe('AppError', () => {
	it('falls back to the default message for its code', () => {
		expect(new AppError('NOT_FOUND').message).toBe('The requested resource was not found.');
	});

	it('prefers an explicit message, and ignores a blank one', () => {
		expect(new AppError('NOT_FOUND', 'User 42 is gone').message).toBe('User 42 is gone');
		expect(new AppError('NOT_FOUND', '   ').message).toBe('The requested resource was not found.');
	});
});

describe('normalizeError', () => {
	it('returns an AppError untouched', () => {
		const err = new AppError('CONFLICT');
		expect(normalizeError(err)).toBe(err);
	});

	it('wraps a plain Error, keeping the original as cause for the stack', () => {
		const cause = new Error('boom');
		const err = normalizeError(cause);

		expect(err.code).toBe('UNKNOWN');
		expect(err.message).toBe('boom');
		expect(err.cause).toBe(cause);
	});

	it('wraps a thrown non-Error', () => {
		expect(normalizeError('nope').message).toBe('nope');
	});
});

describe('normalizeError (air responses)', () => {
	it('maps the backend status string when it names a code', () => {
		const err = normalizeError(airError({ status: 'CONFLICT', message: 'Taken' }, 400));

		expect(err.code).toBe('CONFLICT');
		expect(err.message).toBe('Taken');
	});

	it('maps backend statuses that are not codes through the alias table', () => {
		expect(normalizeError(airError({ status: 'UNPROCESSABLE_ENTITY' }, 500)).code).toBe(
			'BAD_REQUEST'
		);
		expect(normalizeError(airError({ status: 'INTERNAL_SERVER_ERROR' }, 400)).code).toBe(
			'SERVER_ERROR'
		);
	});

	it.each([
		[400, 'BAD_REQUEST'],
		[401, 'UNAUTHORIZED'],
		[403, 'FORBIDDEN'],
		[404, 'NOT_FOUND'],
		[409, 'CONFLICT'],
		[422, 'BAD_REQUEST'],
		[418, 'UNKNOWN'],
		[500, 'SERVER_ERROR'],
		[503, 'SERVER_ERROR']
	])('falls back to the HTTP status: %i → %s', (httpStatus, code) => {
		expect(normalizeError(airError(undefined, httpStatus)).code).toBe(code);
	});

	it('ignores an unrecognized status string and falls back to HTTP', () => {
		expect(normalizeError(airError({ status: 'TEAPOT' }, 404)).code).toBe('NOT_FOUND');
	});

	it('reports a response that never arrived as NETWORK', () => {
		const err = normalizeError(airError(undefined));

		expect(err.code).toBe('NETWORK');
		expect(err.context?.httpStatus).toBe(0);
	});

	it('uses the default message when the body carries none', () => {
		expect(normalizeError(airError({ status: 'FORBIDDEN' }, 403)).message).toBe(
			'You do not have permission for this action.'
		);
	});

	it('keeps the payload and the failed call, but never the request headers', () => {
		const err = normalizeError(
			airError({ status: 'BAD_REQUEST', payload: { email: 'required' } }, 400)
		);

		expect(err.context).toEqual({
			method: 'GET',
			url: 'https://api.test/users/1',
			httpStatus: 400,
			status: 'BAD_REQUEST',
			payload: { email: 'required' }
		});
		expect(JSON.stringify(err.context)).not.toContain('secret');
	});

	it('keeps a status it cannot map, which is where it matters most', () => {
		const err = normalizeError(airError({ status: 'INSUFFICIENT_FUNDS' }, 402));

		// The code says nothing useful, so the raw status is all that names what
		// actually happened.
		expect(err.code).toBe('UNKNOWN');
		expect(err.context?.status).toBe('INSUFFICIENT_FUNDS');
	});

	it('drops body fields that do not follow the convention', () => {
		const err = normalizeError(
			airError({ status: 42, message: { nested: true }, payload: 'x' }, 400)
		);

		expect(err.code).toBe('BAD_REQUEST');
		expect(err.message).toBe('The data provided is invalid.');
		expect(err.context?.payload).toBeUndefined();
	});
});
