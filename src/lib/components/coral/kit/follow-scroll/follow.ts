/**
 * @coral/kit/follow-scroll
 * @version 1.0.0
 */

export type Viewport = {
	scrollTop: number;
	/** The visible height of the scrolling box. */
	clientHeight: number;
	/** The height of everything inside it. */
	scrollHeight: number;
};

/** How far the bottom of the content is below the bottom of the viewport. `0` means the end. */
export function distanceFromEnd({ scrollTop, clientHeight, scrollHeight }: Viewport): number {
	return Math.max(0, scrollHeight - clientHeight - scrollTop);
}

/**
 * Whether the reader is at the end, near enough that new content should keep following them down.
 *
 * A threshold rather than an equality, for three reasons that all look like bugs otherwise:
 * fractional scroll heights on a zoomed or scaled page never reach equality at all; a smooth scroll
 * lands a pixel or two short; and a reader who nudged the wheel once has not asked to stop
 * following. Anything further than that is a deliberate scroll back, and is left alone.
 */
export function isAtEnd(viewport: Viewport, threshold = 32): boolean {
	return distanceFromEnd(viewport) <= Math.max(0, threshold);
}

/**
 * How many entries arrived without being seen.
 *
 * Counted from what was there when following stopped, and never negative: a list that is trimmed
 * as it grows - the last thousand log lines, say - can end up shorter than it was, and that is not
 * news to report.
 */
export function unreadSince(count: number, mark: number): number {
	return Math.max(0, count - mark);
}
