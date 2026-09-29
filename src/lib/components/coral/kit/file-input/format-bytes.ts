/**
 * @coral/kit/file-input
 * @version 1.1.1
 */

import { numberFormat } from '../../lib/intl.js';

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const STEP = 1024;

/**
 * A file size as a person reads it - `740 KB`, and `1.5 MB` or `1,5 MB` depending on who is
 * reading.
 *
 * The function every project ends up rewriting, almost always with `toFixed` - which hardcodes the
 * decimal point and prints `1.5 MB` even where the reader's own locale spells that number `1,5 MB`.
 * `Intl` takes the separator from the locale instead, and the locale defaults to the reader's own
 * rather than to one picked when this was written. Pass `locale` to pin it.
 *
 * Steps of 1024 under `KB`/`MB` labels: strictly `KiB`/`MiB`, but `1 KB = 1024 B` is what the
 * hand-written versions mean and what operating systems show. Bytes are whole, so the base unit
 * gets no decimals.
 */
export function formatBytes(bytes: number, locale?: string): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${UNITS[0]}`;

	let exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(STEP)), UNITS.length - 1);
	// A size that rounds up to a full 1024 belongs in the next unit: `1 MB` reads better than
	// `1024 KB`, and only one of the two is what the next size up would print.
	if (bytes / STEP ** exponent >= 1023.95 && exponent < UNITS.length - 1) exponent += 1;

	const value = bytes / STEP ** exponent;
	const formatted = numberFormat(locale, {
		maximumFractionDigits: exponent === 0 ? 0 : 1,
		// Grouping off. Plenty of locales group thousands with the same mark others use for
		// decimals, so `1023 B` would print as `1.023 B` - which reads as one thousand twenty-three
		// next to a `1,5 MB` on the row above it. Scaling already keeps the number under 1024, so
		// there is never a thousand worth grouping anyway.
		useGrouping: false
	}).format(value);

	return `${formatted} ${UNITS[exponent]}`;
}
