import { normalizeError } from '#lib/core/errors.js';

/**
 * Whether the backend refused the credentials, as opposed to failing to
 * answer. Only a refusal ends a session or reads as "wrong password": an
 * outage must not sign anyone out.
 */
export function isCredentialRejection(err: unknown): boolean {
	const { code } = normalizeError(err);
	return code === 'UNAUTHORIZED' || code === 'FORBIDDEN';
}
