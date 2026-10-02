/**
 * @coral/kit/textarea
 * @version 1.0.0
 */

export type Metrics = {
	/** The content height the element reports while its own height is unconstrained. */
	scrollHeight: number;
	/** The resolved `line-height`, in pixels. */
	lineHeight: number;
	/** `padding-top` plus `padding-bottom`. */
	padding: number;
	/** `border-top-width` plus `border-bottom-width`. */
	border: number;
	/** Whether the element is sized as a border box, which every Tailwind project is. */
	borderBox: boolean;
	/** Never shorter than this many lines. */
	minRows: number;
	/** Never taller. Omitted means it grows as far as the content does. */
	maxRows?: number;
};

export type Height = {
	/** What to set the element's height to, in pixels. */
	height: number;
	/** Whether the content is taller than that, so the field has to scroll inside itself. */
	scrollable: boolean;
};

/** The height of `rows` lines, in whichever box the element is sized by. */
function rowsHeight(rows: number, { lineHeight, padding, border, borderBox }: Metrics): number {
	return rows * lineHeight + padding + (borderBox ? border : 0);
}

/**
 * How tall the field should be for the text it holds.
 *
 * `scrollHeight` includes padding but never border, which is the detail every hand-rolled version
 * gets wrong in one direction or the other: in a border-box element - which is every Tailwind
 * project - the border has to be added back, or the field loses a pixel or two on each grow and
 * the text creeps under its own edge.
 */
export function heightFor(metrics: Metrics): Height {
	const { scrollHeight, padding, border, borderBox, minRows, maxRows } = metrics;

	const content = borderBox ? scrollHeight + border : scrollHeight - padding;
	const min = rowsHeight(Math.max(1, minRows), metrics);
	const max = maxRows === undefined ? Number.POSITIVE_INFINITY : rowsHeight(maxRows, metrics);

	return {
		height: Math.min(Math.max(content, min), max),
		// A pixel of slack: sub-pixel line heights round differently between the two measurements,
		// and without it a field at exactly its limit flickers a scrollbar in and out.
		scrollable: content > max + 1
	};
}

/**
 * How many characters a field holds, counted the way `maxlength` counts them.
 *
 * Not code points. The browser enforces its limit in UTF-16 units, so an emoji spends two of them -
 * and a counter that says `3/10` while the field refuses an eighth character is a counter nobody
 * believes. Counting what the platform counts is the only way the two agree.
 */
export function countOf(value: string): number {
	return value.length;
}

/** How many are left, floored at zero: a limit that is already spent is spent, not negative. */
export function remaining(value: string, limit: number): number {
	return Math.max(0, limit - countOf(value));
}
