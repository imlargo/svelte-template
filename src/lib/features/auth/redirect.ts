/**
 * Handling of the `?redirect=` parameter used by the auth flow.
 *
 * `handleAuth` encodes the path the user was trying to reach, and the
 * login/authorize pages decode it after a successful sign-in. Checking that the
 * decoded value starts with `/` is NOT enough: `//evil.com` passes that test but
 * is a protocol-relative URL, so redirecting to it leaves the site. Every value
 * is re-parsed against a throwaway origin and rejected unless it stays on it.
 */

// Only exists so the URL parser can tell us whether the path escaped its origin.
// Never resolved or requested.
const INTERNAL_ORIGIN = 'http://redirect.invalid';

/**
 * Encodes a same-origin path for use as the `?redirect=` value.
 * Note: base64 is Latin-1 only, so non-ASCII paths still throw here.
 */
export function encodeRedirect(pathAndSearch: string): string {
	return btoa(pathAndSearch);
}

/**
 * Returns `path` only if it points somewhere on this origin, otherwise null.
 * Rejects absolute URLs, protocol-relative URLs (`//host`) and their backslash
 * variants (`/\host`), which the URL parser also resolves off-origin.
 */
export function sanitizeRedirect(path: string): string | null {
	if (!path.startsWith('/')) return null;

	let url: URL;
	try {
		url = new URL(path, INTERNAL_ORIGIN);
	} catch {
		return null;
	}

	if (url.origin !== INTERNAL_ORIGIN) return null;

	return url.pathname + url.search + url.hash;
}

/**
 * Decodes a `?redirect=` value into a safe same-origin path.
 * Returns null when the value is missing, malformed, or points off-origin.
 */
export function decodeRedirect(value: string | null | undefined): string | null {
	if (!value) return null;

	let decoded: string;
	try {
		decoded = atob(value);
	} catch {
		return null; // malformed base64
	}

	return sanitizeRedirect(decoded);
}
