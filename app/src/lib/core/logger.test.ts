import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger, setLogger, type Logger } from './logger';
import { AppError } from './errors';

// Snapshot the default so swapping it below doesn't leak into other test files.
const defaultLogger = logger;
afterEach(() => setLogger(defaultLogger));

describe('logger (ConsoleLogger, the default)', () => {
	it('logs under the given scope and returns a message safe to show a user', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const message = logger.error('auth', new AppError('NOT_FOUND', 'User 42 is gone'));

		expect(spy).toHaveBeenCalledWith('[auth]', expect.anything());
		expect(message).toBe('User 42 is gone');
		spy.mockRestore();
	});

	it('never returns the raw message of an unexpected error', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const message = logger.error('server', new TypeError('Cannot read properties of undefined'));

		expect(message).toBe('An unexpected error occurred.');
		spy.mockRestore();
	});

	it('attaches the context to the line it logs', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		logger.warn('auth', 'Undeclared page route', { pathname: '/reports' });

		expect(spy).toHaveBeenCalledWith('[auth]', 'Undeclared page route', { pathname: '/reports' });
		spy.mockRestore();
	});
});

describe('setLogger', () => {
	it('swaps the implementation every caller uses, without touching the call sites', () => {
		const calls: Array<[string, unknown]> = [];
		const fake: Logger = {
			info() {},
			warn() {},
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
