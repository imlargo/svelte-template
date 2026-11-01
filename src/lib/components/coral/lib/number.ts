/**
 * @coral/lib/number
 * @version 1.2.0
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
	/** How the value is written - a currency, a percent, a unit - so its symbols can be read past. */
	style?: Intl.NumberFormatOptions;
};

/** The parts of a formatted number that are not the number: `$`, `%`, `km/h`, `CHF`. */
const AFFIXES = new Set(['currency', 'percentSign', 'unit', 'literal']);

/**
 * Everything `style` writes around a number, longest first, so `US$` goes before a lone `$` would
 * leave the `US` behind. Read off a negative and a positive value, because some locales move the
 * symbol to the other side of the minus.
 */
function affixes(locale: string | undefined, style: Intl.NumberFormatOptions): string[] {
	const formatter = numberFormat(locale, style);
	const parts = [...formatter.formatToParts(-1.5), ...formatter.formatToParts(1.5)];
	const found = parts
		.filter((part) => AFFIXES.has(part.type) && part.value.trim() !== '')
		.map((part) => part.value.trim());
	return [...new Set(found)].sort((a, b) => b.length - a.length);
}

/** Whether `style` shows a fraction as a percent: the value `0.15` is written `15%`. */
const isPercent = (style?: Intl.NumberFormatOptions) => style?.style === 'percent';

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
	{ min, max, decimals, locale, style }: ParseOptions
): number | undefined {
	let text = raw.trim();
	if (style) for (const affix of affixes(locale, style)) text = text.replaceAll(affix, '');
	text = text.trim();
	if (text === '') return undefined;

	const { decimal, group } = separators(locale);
	const normalized = (group ? text.replaceAll(group, '') : text)
		.replace(/\s/g, '')
		.replace(decimal, '.')
		// The minus `Intl` prints in some locales is not the hyphen a keyboard types.
		.replace('\u2212', '-');

	const read = Number(normalized);
	if (Number.isNaN(read)) return undefined;

	// Typed as a percent with or without the sign: `15` in a percent field is fifteen percent.
	const parsed = isPercent(style) ? read / 100 : read;

	return clamp(round(parsed, decimals), min, max);
}

/**
 * The fraction digits `style` always writes: two for dollars, none for yen, none without a style.
 * A currency field whose step is `1` still takes cents, and this is how it knows to.
 */
export function fractionDigits(locale: string | undefined, style?: Intl.NumberFormatOptions) {
	return style ? (numberFormat(locale, style).resolvedOptions().minimumFractionDigits ?? 0) : 0;
}

/**
 * Writes a value the way the locale does, without grouping: a field is typed into, and a thousands
 * separator appearing under the caret on commit is one more thing to delete on the next edit.
 *
 * `decimals` is the precision of the value, so a percent shows two fewer: `0.155` is `15.5%`.
 */
export function format(
	value: number,
	decimals: number,
	locale?: string,
	style?: Intl.NumberFormatOptions
): string {
	const shown = precision(isPercent(style) ? decimals - 2 : decimals);
	return numberFormat(locale, {
		...style,
		maximumFractionDigits: shown,
		minimumFractionDigits: Math.min(shown, fractionDigits(locale, style)),
		useGrouping: false
	}).format(value);
}
