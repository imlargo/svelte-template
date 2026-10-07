import { describe, expect, it } from 'vitest';
import { isPrefixOf } from './paths';

describe('isPrefixOf', () => {
	// The sidebar's notion of "active": an entry lights up for its own page and
	// everything nested under it, and nothing else.
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
