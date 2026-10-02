/**
 * The `?redirect=` parameter of the auth flow: the hook encodes where the user
 * was going, and login/authorize decode it after signing in.
 */

export const REDIRECT_PARAM = 'redirect';

// Only lets the URL parser tell whether a path escaped its origin. Never requested.
const INTERNAL_ORIGIN = 'http://redirect.invalid';

/** Base64 is Latin-1 only, so a non-ASCII path throws here. */
export function encodeRedirect(pathAndSearch: string): string {
	return btoa(pathAndSearch);
}

/**
 * Returns `path` only if it stays on this origin. Starting with `/` is not
 * enough: `//evil.com` and `/\evil.com` resolve off-origin.
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

/** A safe same-origin path, or null when the value is missing, malformed or off-origin. */
export function decodeRedirect(value: string | null | undefined): string | null {
	if (!value) return null;

	let decoded: string;
	try {
		decoded = atob(value);
	} catch {
		return null;
	}

	return sanitizeRedirect(decoded);
}
