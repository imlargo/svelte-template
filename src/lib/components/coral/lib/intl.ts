/**
 * @coral/lib/intl
 * @version 1.0.0
 */

const cache = new Map<string, unknown>();

/**
 * One instance per constructor, locale and options, built on first use: `Intl` objects are costly
 * to build and callers sit in loops. A `locale` left out follows the reader's own.
 */
function cached<T>(
	kind: string,
	locale: string | undefined,
	options: object | undefined,
	build: () => T
): T {
	const key = `${kind}|${locale ?? ''}|${options ? JSON.stringify(options) : ''}`;
	if (cache.has(key)) return cache.get(key) as T;

	const built = build();
	cache.set(key, built);
	return built;
}

export function collator(locale?: string, options?: Intl.CollatorOptions): Intl.Collator {
	return cached('collator', locale, options, () => new Intl.Collator(locale, options));
}

export function dateTimeFormat(
	locale?: string,
	options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
	return cached('date', locale, options, () => new Intl.DateTimeFormat(locale, options));
}

export function numberFormat(
	locale?: string,
	options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
	return cached('number', locale, options, () => new Intl.NumberFormat(locale, options));
}

export function relativeTimeFormat(
	locale?: string,
	options?: Intl.RelativeTimeFormatOptions
): Intl.RelativeTimeFormat {
	return cached('relative', locale, options, () => new Intl.RelativeTimeFormat(locale, options));
}
