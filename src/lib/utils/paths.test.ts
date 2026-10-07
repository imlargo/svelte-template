import { describe, expect, it } from 'vitest';
import { isPrefixOf } from './paths';

describe('isPrefixOf', () => {
	it('matches the route itself and its nested paths', () => {
		expect(isPrefixOf('/admin', '/admin')).toBe(true);
		expect(isPrefixOf('/admin', '/admin/users')).toBe(true);
	});

	it('does not let the root act as a prefix for every path', () => {
		expect(isPrefixOf('/', '/')).toBe(true);
		expect(isPrefixOf('/', '/admin')).toBe(false);
	});

	it('does not match a sibling that merely shares a prefix string', () => {
		expect(isPrefixOf('/admin', '/admin-panel')).toBe(false);
	});
});
