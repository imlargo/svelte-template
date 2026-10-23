/**
 * @coral/lib/scale
 * @version 1.0.0
 */

/**
 * How much larger an element is drawn than it is laid out, per axis: `{ x: 0.5, y: 0.5 }` inside a
 * `scale(0.5)`, and `1` almost everywhere else. Rects report drawn sizes while `clientHeight`,
 * `scrollTop` and CSS positions are layout ones, so a measurement that mixes them divides by this.
 */
export function scaleOf(element: HTMLElement): { x: number; y: number } {
	const drawn = element.getBoundingClientRect();
	// `|| 1` also covers an element with no box at all, where both sides are zero.
	return {
		x: drawn.width / element.offsetWidth || 1,
		y: drawn.height / element.offsetHeight || 1
	};
}
