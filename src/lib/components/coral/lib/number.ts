/**
 * @coral/lib/number
 * @version 1.0.0
 */

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
	return Number(value.toFixed(Math.min(Math.max(decimals, 0), 20)));
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

/**
 * Reads what someone typed, on commit rather than per keystroke. `undefined` for an empty field:
 * clearing means "no value", not "the smallest allowed one". Browsers hand back an empty string for
 * anything they cannot parse, so unparseable input arrives here as empty too.
 */
export function parse(
	raw: string,
	min: number | undefined,
	max: number | undefined,
	decimals: number
): number | undefined {
	if (raw.trim() === '') return undefined;

	const parsed = Number(raw);
	if (Number.isNaN(parsed)) return undefined;

	return clamp(round(parsed, decimals), min, max);
}
