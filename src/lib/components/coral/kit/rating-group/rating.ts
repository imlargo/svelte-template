/**
 * @coral/kit/rating-group
 * @version 1.0.0
 */

/**
 * The values a click or an arrow key can land on, ascending. Half steps double the options rather
 * than adding a mode: `allowHalf` turns five choices into ten, and the radios, hit areas and
 * keyboard all read this one list instead of branching on the flag.
 */
export function stepsFor(count: number, allowHalf = false): number[] {
	const total = Math.max(0, Math.floor(count));
	const size = allowHalf ? 0.5 : 1;

	const steps: number[] = [];
	// Halves are exact in binary, so the accumulator cannot drift the way a 0.1 step would.
	for (let value = size; value <= total; value += size) steps.push(value);
	return steps;
}

/**
 * How much of the star at `index` is filled, `0` to `1`. A fraction rather than
 * `'empty' | 'half' | 'full'`, because a rating only ever displayed - an average of 4.3 - has no
 * reason to be rounded. The filled layer is clipped to it, so 0.3 needs no dedicated glyph.
 */
export function fillOf(value: number, index: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value - index));
}

/**
 * The nearest value that can actually be picked. Displayed and selectable are not the same thing:
 * `value` may arrive as an average, and the radio that ends up checked is a real step. Rounds,
 * clamps into range, and reads anything that is not a number as no rating at all.
 */
export function snap(value: number, count: number, allowHalf = false): number {
	if (!Number.isFinite(value) || value <= 0) return 0;

	const size = allowHalf ? 0.5 : 1;
	const total = Math.max(0, Math.floor(count));
	return Math.round(Math.min(value, total) / size) * size;
}
