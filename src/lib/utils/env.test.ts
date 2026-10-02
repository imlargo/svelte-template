import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { flag, parseEnv, unset } from './env';

const Schema = z.object({
	URL: z.url(),
	ENABLED: flag(true),
	NAME: z.preprocess(unset, z.string().default('fallback'))
});

describe('parseEnv', () => {
	it('applies defaults to missing and empty variables', () => {
		expect(parseEnv(Schema, { URL: 'http://api.test', NAME: '' })).toEqual({
			URL: 'http://api.test',
			ENABLED: true,
			NAME: 'fallback'
		});
	});

	it('accepts exactly true or false as a flag', () => {
		expect(parseEnv(Schema, { URL: 'http://api.test', ENABLED: 'false' }).ENABLED).toBe(false);
		expect(() => parseEnv(Schema, { URL: 'http://api.test', ENABLED: 'yes' })).toThrow(/ENABLED/);
	});

	it('names every invalid variable in one error', () => {
		expect(() => parseEnv(Schema, { URL: 'not a url', ENABLED: '1' })).toThrow(
			/URL:[\s\S]*ENABLED:/
		);
	});
});
