import { describe, expect, it } from 'vitest';
import { parseErrorBody } from './errors';

describe('parseErrorBody', () => {
	it('maps the statuses this backend spells its own way', () => {
		expect(parseErrorBody({ status: 'UNPROCESSABLE_ENTITY' }).code).toBe('BAD_REQUEST');
		expect(parseErrorBody({ status: 'INTERNAL_SERVER_ERROR' }).code).toBe('SERVER_ERROR');
	});

	it('keeps a status spelled like a code, and leaves the rest to the HTTP status', () => {
		expect(parseErrorBody({ status: 'CONFLICT', message: 'Taken' })).toMatchObject({
			code: 'CONFLICT',
			message: 'Taken'
		});
		expect(parseErrorBody({ status: 'TEAPOT' }).code).toBeUndefined();
	});
});
