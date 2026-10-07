import { describe, expect, it } from 'vitest';
import { SIGN_IN_ERRORS, signInErrorMessage } from './sign-in-errors';

describe('signInErrorMessage', () => {
	it('answers nothing without a code', () => {
		expect(signInErrorMessage(null)).toBeNull();
		expect(signInErrorMessage('')).toBeNull();
	});

	it('names a known code', () => {
		expect(signInErrorMessage(SIGN_IN_ERRORS.failed)).toBe(
			'Could not sign you in. Please try again.'
		);
	});

	it('never echoes an unknown value', () => {
		expect(signInErrorMessage('<script>alert(1)</script>')).toBe(
			'Could not sign you in. Please try again.'
		);
		expect(signInErrorMessage('constructor')).toBe('Could not sign you in. Please try again.');
	});
});
