/**
 * Why a sign-in was refused, as a code on the login URL. Codes, never
 * messages: a query parameter that becomes visible text would let anyone put
 * words in the app's mouth, so an unknown value falls back to the generic one.
 * Add a code here when the backend refuses for a reason worth explaining
 * ("unregistered", "inactive").
 */
export const SIGN_IN_ERROR_PARAM = 'error';

export const SIGN_IN_ERRORS = {
	/** The exchange with the provider or the backend did not complete. */
	failed: 'failed'
} as const;

export type SignInError = (typeof SIGN_IN_ERRORS)[keyof typeof SIGN_IN_ERRORS];

const MESSAGES: Record<SignInError, string> = {
	[SIGN_IN_ERRORS.failed]: 'Could not sign you in. Please try again.'
};

export function signInErrorMessage(value: string | null): string | null {
	if (!value) return null;
	return Object.hasOwn(MESSAGES, value)
		? MESSAGES[value as SignInError]
		: MESSAGES[SIGN_IN_ERRORS.failed];
}
