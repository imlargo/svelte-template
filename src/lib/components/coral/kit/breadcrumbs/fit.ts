/**
 * @coral/kit/breadcrumbs
 * @version 1.0.0
 */

export type TrailWidths = {
	/** Each crumb as drawn, in order, separators excluded. */
	items: number[];
	/** One separator. */
	separator: number;
	/** The control the folded crumbs collapse into. */
	ellipsis: number;
};

/**
 * How many crumbs after the first to fold away so the trail fits in `available`. Zero when it fits
 * as it is. The first crumb and the last - the current page - are never folded: a trail that has
 * lost where it starts or where it is has stopped being a trail, and a long name on either end is
 * truncated instead.
 *
 * Folding runs from the second crumb forward, so what disappears first is the middle of the path,
 * and what the reader sees is root, the fold, and the pages nearest to where they are.
 */
export function foldCount({ items, separator, ellipsis }: TrailWidths, available: number): number {
	const count = items.length;
	if (count <= 2) return 0;

	const total = items.reduce((sum, width) => sum + width, 0) + separator * (count - 1);
	if (total <= available) return 0;

	// With `k` crumbs folded the trail is: first, separator, ellipsis, then `count - 1 - k` crumbs
	// each with a separator before it.
	for (let folded = 1; folded <= count - 2; folded++) {
		const shown = items.slice(1 + folded);
		const width =
			items[0] + separator + ellipsis + shown.reduce((sum, item) => sum + separator + item, 0);
		if (width <= available) return folded;
	}
	return count - 2;
}
