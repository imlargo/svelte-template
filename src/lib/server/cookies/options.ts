import type { AuthCookiesManagerOptions } from './cookies_options';

const maxAgeDefault = 60 * 60 * 24 * 7;

/**
 * Parses and normalizes the options for the authentication cookies manager.
 *
 * Ensures that all required cookie options are set, applying default values where necessary.
 *
 * @param options - The options object to parse, which may contain cookie configuration properties.
 * @returns A normalized `AuthCookiesManagerOptions` object with all cookie properties set.
 */
export function parseAuthCookiesManagerOptions(options: AuthCookiesManagerOptions) {
	const parsed: AuthCookiesManagerOptions = {
		cookies: {}
	};

	parsed.cookies.maxAgeSeconds = options?.cookies?.maxAgeSeconds
		? options.cookies.maxAgeSeconds
		: maxAgeDefault;
	parsed.cookies.accessTokenCookieName = stringOrDefault(
		options?.cookies?.accessTokenCookieName,
		'access_token'
	);
	parsed.cookies.refreshTokenCookieName = stringOrDefault(
		options?.cookies?.refreshTokenCookieName,
		'refresh_token'
	);
	parsed.cookies.domain = stringOrDefault(options?.cookies?.domain, '');
	parsed.cookies.sameSite = stringOrDefault(options?.cookies?.sameSite, '') as '';

	return parsed;
}

function isStringPresent(value: string | undefined | null): boolean {
	return value !== undefined && value !== null && value !== '';
}

function stringOrDefault(value: string | undefined | null, defaultValue: string): string {
	return isStringPresent(value) ? (value as string) : defaultValue;
}
