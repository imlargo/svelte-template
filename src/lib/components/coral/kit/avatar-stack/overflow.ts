/**
 * @coral/kit/avatar-stack
 * @version 1.0.0
 */

export type Overflow<T> = {
	/** Drawn as avatars, in order. */
	visible: T[];
	/** Folded into the count. Never exactly one - see `split`. */
	hidden: T[];
};

/**
 * Splits a list into what is drawn and what is counted.
 *
 * `max` is how many circles the stack takes up, the count included - the width a layout reserves
 * for it. So when the list overflows, one slot goes to the count. And a count of `+1` never
 * appears: it would take up the same slot as the one avatar it hides, so that avatar is drawn
 * instead. A `max` below 1 is read as 1, because a stack that draws nothing is not a stack.
 */
export function split<T>(items: T[], max?: number): Overflow<T> {
	if (max === undefined || !Number.isFinite(max)) return { visible: items, hidden: [] };

	const slots = Math.max(1, Math.floor(max));
	if (items.length <= slots) return { visible: items, hidden: [] };

	const shown = slots - 1;
	return { visible: items.slice(0, shown), hidden: items.slice(shown) };
}
