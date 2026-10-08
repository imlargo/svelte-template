import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { AppError } from '#lib/core/errors.js';
import { errorResponse, readBody } from './api';

vi.mock('#lib/core/logger.js', () => ({
	logger: {
		error: vi.fn(() => 'Server error. Please try again later.'),
		warn: vi.fn(),
		info: vi.fn()
	}
}));

describe('errorResponse', () => {
	it('surfaces an expected error with its own message and status', async () => {
		const response = errorResponse(new AppError('CONFLICT', 'ada@example.com is taken.'));

		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({
			status: 'CONFLICT',
			message: 'ada@example.com is taken.'
		});
	});

	it('logs a bug and answers with the generic message', async () => {
		const response = errorResponse(new TypeError('Cannot read properties of undefined'));

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({
			status: 'UNKNOWN',
			message: 'Server error. Please try again later.'
		});
	});
});

describe('readBody', () => {
	const schema = z.object({ email: z.email('Enter a valid email address.') });
	const request = (body: BodyInit) =>
		new Request('http://localhost/api/test', { method: 'POST', body });

	it('answers the parsed data', async () => {
		const result = await readBody(request('{"email":"ada@example.com"}'), schema, 'Invalid.');

		expect(result).toEqual({ ok: true, data: { email: 'ada@example.com' } });
	});

	it('answers 400 with the first issue', async () => {
		const result = await readBody(request('{"email":"nope"}'), schema, 'Invalid.');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.response.status).toBe(400);
		await expect(result.response.json()).resolves.toEqual({
			status: 'BAD_REQUEST',
			message: 'Enter a valid email address.'
		});
	});

	it('answers 400 with the fallback when the body is not JSON', async () => {
		const result = await readBody(request('not json'), schema, 'Invalid.');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		await expect(result.response.json()).resolves.toMatchObject({ message: 'Invalid.' });
	});
});
