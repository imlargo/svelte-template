/** The `?redirect=` parameter of the auth flow: where the user was going, as a path with its query. */
export const REDIRECT_PARAM = 'redirect';

// Only lets the URL parser tell whether a path escaped its origin. Never requested.
const INTERNAL_ORIGIN = 'http://redirect.invalid';

/**
 * Returns `path` only if it stays on this origin. Starting with `/` is not
 * enough: `//evil.com` and `/\evil.com` resolve off-origin.
 */
export function sanitizeRedirect(path: string | null | undefined): string | null {
	if (!path?.startsWith('/')) return null;

	let url: URL;
	try {
		url = new URL(path, INTERNAL_ORIGIN);
	} catch {
		return null;
	}

	if (url.origin !== INTERNAL_ORIGIN) return null;

	return url.pathname + url.search + url.hash;
}
