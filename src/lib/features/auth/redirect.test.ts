import { describe, it, expect } from 'vitest';
import { encodeRedirect, decodeRedirect, sanitizeRedirect } from './redirect';

describe('sanitizeRedirect', () => {
	it('accepts same-origin paths', () => {
		expect(sanitizeRedirect('/')).toBe('/');
		expect(sanitizeRedirect('/settings')).toBe('/settings');
		expect(sanitizeRedirect('/admin/users?page=2')).toBe('/admin/users?page=2');
		expect(sanitizeRedirect('/report#section')).toBe('/report#section');
	});

	it('rejects protocol-relative URLs', () => {
		expect(sanitizeRedirect('//evil.com')).toBeNull();
		expect(sanitizeRedirect('//evil.com/phish')).toBeNull();
	});

	it('rejects backslash variants the URL parser resolves off-origin', () => {
		expect(sanitizeRedirect('/\\evil.com')).toBeNull();
		expect(sanitizeRedirect('/\\/evil.com')).toBeNull();
	});

	it('rejects absolute URLs', () => {
		expect(sanitizeRedirect('https://evil.com')).toBeNull();
		expect(sanitizeRedirect('javascript:alert(1)')).toBeNull();
	});

	it('rejects paths that do not start with a slash', () => {
		expect(sanitizeRedirect('settings')).toBeNull();
		expect(sanitizeRedirect('')).toBeNull();
	});
});

describe('decodeRedirect', () => {
	it('round-trips an encoded path', () => {
		expect(decodeRedirect(encodeRedirect('/admin/users?page=2'))).toBe('/admin/users?page=2');
	});

	it('returns null for missing or malformed values', () => {
		expect(decodeRedirect(null)).toBeNull();
		expect(decodeRedirect(undefined)).toBeNull();
		expect(decodeRedirect('')).toBeNull();
		expect(decodeRedirect('not-base64!!')).toBeNull();
	});

	it('rejects an off-origin path even when correctly encoded', () => {
		expect(decodeRedirect(encodeRedirect('//evil.com'))).toBeNull();
		expect(decodeRedirect(encodeRedirect('https://evil.com'))).toBeNull();
	});
});
