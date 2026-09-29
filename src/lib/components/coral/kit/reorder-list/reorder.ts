/**
 * @coral/kit/reorder-list
 * @version 1.0.0
 */

/** A copy of `items` with the entry at `from` moved to `to`. Out-of-range indexes are clamped. */
export function move<T>(items: readonly T[], from: number, to: number): T[] {
	const next = [...items];
	if (from < 0 || from >= next.length) return next;

	const target = Math.max(0, Math.min(next.length - 1, to));
	const [entry] = next.splice(from, 1);
	next.splice(target, 0, entry);
	return next;
}

/**
 * Where a dragged row belongs, given the vertical midpoints of every row as currently laid out and
 * the midpoint of the row being dragged.
 *
 * The answer is how many of the *other* rows sit above the dragged one's centre. Comparing centre
 * to centre is what makes a row swap places exactly when the dragged row covers half of it -
 * comparing the pointer instead makes the result depend on where on the handle it was grabbed.
 */
export function targetIndex(midpoints: readonly number[], dragged: number, center: number): number {
	let index = 0;
	midpoints.forEach((midpoint, at) => {
		if (at !== dragged && midpoint < center) index++;
	});
	return index;
}

/** Where a key press moves an entry, or `null` for a key that does not move it. */
export function keyTarget(key: string, index: number, length: number): number | null {
	switch (key) {
		case 'ArrowUp':
			return Math.max(0, index - 1);
		case 'ArrowDown':
			return Math.min(length - 1, index + 1);
		case 'Home':
			return 0;
		case 'End':
			return length - 1;
		default:
			return null;
	}
}
