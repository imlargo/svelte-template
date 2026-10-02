import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { flag, unset } from './env';

describe('flag', () => {
	it('takes the fallback when missing or empty', () => {
		expect(flag(true).parse(undefined)).toBe(true);
		expect(flag(false).parse('')).toBe(false);
	});

	it('accepts exactly true or false', () => {
		expect(flag(true).parse('false')).toBe(false);
		expect(flag(false).parse('true')).toBe(true);
		expect(flag(true).safeParse('yes').success).toBe(false);
		expect(flag(true).safeParse('TRUE').success).toBe(false);
	});
});

describe('unset', () => {
	it('lets an empty value fall back to the default', () => {
		expect(unset(z.string().default('fallback')).parse('')).toBe('fallback');
	});

	it('still validates a value that is set', () => {
		expect(unset(z.url().optional()).safeParse('not a url').success).toBe(false);
	});
});
