import { describe, expect, it } from 'vitest';
import { activeHref, isPrefixOf } from './paths';

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

describe('activeHref', () => {
	const hrefs = ['/', '/admin', '/admin/users', '/tasks', '/tasks?project=1'];

	it('picks the longest entry the page sits under', () => {
		expect(activeHref(hrefs, { pathname: '/admin/users/3', search: '' })).toBe('/admin/users');
		expect(activeHref(hrefs, { pathname: '/admin', search: '' })).toBe('/admin');
	});

	it('matches an entry with a query only on that exact page', () => {
		expect(activeHref(hrefs, { pathname: '/tasks', search: '?project=1' })).toBe(
			'/tasks?project=1'
		);
		expect(activeHref(hrefs, { pathname: '/tasks', search: '?project=2' })).toBe('/tasks');
	});

	it('returns null for a page no entry covers', () => {
		expect(activeHref(hrefs, { pathname: '/settings', search: '' })).toBeNull();
	});
});
