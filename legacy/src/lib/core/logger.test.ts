import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger, setLogger, type Logger } from './logger';

// Snapshot the default so swapping it below doesn't leak into other test files.
const defaultLogger = logger;
afterEach(() => setLogger(defaultLogger));

describe('logger (ConsoleLogger, the default)', () => {
	it('logs under the given scope and returns a message safe to show a user', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const message = logger.error('auth', new Error('boom'));

		expect(spy).toHaveBeenCalledWith('[auth]', expect.anything());
		expect(message).toBe('boom');
		spy.mockRestore();
	});
});

describe('setLogger', () => {
	it('swaps the implementation every caller uses, without touching the call sites', () => {
		const calls: Array<[string, unknown]> = [];
		const fake: Logger = {
			error(scope, error) {
				calls.push([scope, error]);
				return 'handled';
			}
		};

		setLogger(fake);
		const message = logger.error('server', 'db down');

		expect(calls).toEqual([['server', 'db down']]);
		expect(message).toBe('handled');
	});
});
