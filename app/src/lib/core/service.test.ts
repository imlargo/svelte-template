import { describe, expect, it } from 'vitest';
import { BaseService } from './service';
import { AppError } from './errors';

/** `expectBody` is protected, so a subclass is the only way in — as for a real service. */
class Probe extends BaseService {
	call<T>(request: Promise<T | null>) {
		return this.expectBody(request);
	}
}

describe('BaseService.expectBody', () => {
	it('passes the body through, including falsy ones', async () => {
		await expect(new Probe().call(Promise.resolve({ id: '1' }))).resolves.toEqual({ id: '1' });
		await expect(new Probe().call(Promise.resolve(0))).resolves.toBe(0);
	});

	it('rejects an empty body, which air resolves to null', async () => {
		const error = await new Probe().call(Promise.resolve(null)).catch((err: unknown) => err);

		expect(error).toBeInstanceOf(AppError);
		expect((error as AppError).code).toBe('SERVER_ERROR');
	});
});
