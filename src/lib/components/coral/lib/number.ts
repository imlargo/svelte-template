/**
 * @coral/lib/number
 * @version 1.1.0
 */

import { numberFormat } from './intl.js';

/** `toFixed` and `Intl` both refuse more than twenty decimals. */
const MAX_DECIMALS = 20;
const precision = (decimals: number) => Math.min(Math.max(decimals, 0), MAX_DECIMALS);

/**
 * How many decimals a step implies: `0.1` gives 1, `0.05` gives 2, `1` gives 0. Exponent notation
 * is read too - `1e-7` is a legitimate step, and `'1e-7'` has no decimal point to count.
 */
export function decimalsOf(step: number): number {
	if (!Number.isFinite(step)) return 0;

	const text = String(Math.abs(step));
	const [mantissa, exponent] = text.split('e-');
	const fraction = mantissa.split('.')[1]?.length ?? 0;

	return exponent ? Number(exponent) + fraction : fraction;
}

/**
 * Rounds to a fixed number of decimals. Stepping is repeated addition on binary floats, so
 * `0.1 + 0.2` is `0.30000000000000004` and a price field drifts into nonsense after a few clicks.
 * Rounding to the precision the step already implies keeps every stop on the ladder exact.
 */
export function round(value: number, decimals: number): number {
	if (!Number.isFinite(value)) return value;
	return Number(value.toFixed(precision(decimals)));
}

/**
 * Holds a value inside its bounds. `max` is applied before `min`, so bounds passed the wrong way
 * round give `min` rather than something below both. Either may be left out, meaning unbounded
 * that way: defaulting `min` to `0` would quietly hide every negative a caller meant to allow.
 */
export function clamp(value: number, min?: number, max?: number): number {
	let next = value;
	if (max !== undefined) next = Math.min(max, next);
	if (min !== undefined) next = Math.max(min, next);
	return next;
}

export type StepOptions = {
	value: number | undefined;
	delta: number;
	min?: number;
	max?: number;
	decimals: number;
};

/**
 * The next value after a step, rounded and clamped. An empty field steps from `0`, not `min`: with
 * `min = 5` and `step = 1`, one press of `+` lands on 5 - the first allowed value - not 6.
 */
export function stepValue({ value, delta, min, max, decimals }: StepOptions): number {
	return clamp(round((value ?? 0) + delta, decimals), min, max);
}

export type Separators = {
	/** What sits between the whole part and the fraction: `.` in `en-US`, `,` in `de-DE`. */
	decimal: string;
	/** What groups the thousands, or an empty string where the locale writes none. */
	group: string;
};

const separatorsByLocale = new Map<string | undefined, Separators>();

/** The separators a locale writes numbers with, read off `Intl` once per locale. */
export function separators(locale?: string): Separators {
	const known = separatorsByLocale.get(locale);
	if (known) return known;

	const parts = numberFormat(locale).formatToParts(12345.6);
	const found = {
		decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
		group: parts.find((part) => part.type === 'group')?.value ?? ''
	};
	separatorsByLocale.set(locale, found);
	return found;
}

export type ParseOptions = {
	min?: number;
	max?: number;
	decimals: number;
	/** The locale the text was typed in. Left out, the reader's own. */
	locale?: string;
};

/**
 * Reads what someone typed, on commit rather than per keystroke, the way their locale writes it:
 * `1,5` is one and a half in `de-DE` and fifteen in `en-US`, because there the comma groups
 * thousands. Group separators are dropped along with any whitespace, since a locale that groups
 * with a narrow space gets a plain one typed, and the locale's decimal becomes the point `Number`
 * reads. `undefined` for an empty or unreadable field: clearing means "no value", not "the smallest
 * allowed one".
 */
export function parse(
	raw: string,
	{ min, max, decimals, locale }: ParseOptions
): number | undefined {
	const text = raw.trim();
	if (text === '') return undefined;

	const { decimal, group } = separators(locale);
	const normalized = (group ? text.replaceAll(group, '') : text)
		.replace(/\s/g, '')
		.replace(decimal, '.')
		// The minus `Intl` prints in some locales is not the hyphen a keyboard types.
		.replace('\u2212', '-');

	const parsed = Number(normalized);
	if (Number.isNaN(parsed)) return undefined;

	return clamp(round(parsed, decimals), min, max);
}

/**
 * Writes a value the way the locale does, without grouping: a field is typed into, and a thousands
 * separator appearing under the caret on commit is one more thing to delete on the next edit.
 */
export function format(value: number, decimals: number, locale?: string): string {
	return numberFormat(locale, {
		maximumFractionDigits: precision(decimals),
		useGrouping: false
	}).format(value);
}
