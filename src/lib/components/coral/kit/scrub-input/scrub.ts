/**
 * @coral/kit/scrub-input
 * @version 1.0.0
 */

/** Whole steps taken out of a drag, and the distance left over for the next move event. */
export type Consumed = {
	steps: number;
	/** Pixels not yet spent, keeping their sign. Feed this back in with the next delta. */
	rest: number;
};

/**
 * Turns an accumulated drag distance into whole steps.
 *
 * The leftover is carried rather than dropped, which is the difference between a field that tracks
 * a slow drag and one that ignores it: pointer moves arrive a pixel or two at a time, and rounding
 * each one on its own rounds every single move down to nothing.
 *
 * Truncated towards zero, so a drag that crosses back over its starting point spends the same
 * distance in either direction instead of gaining a step at the turn.
 */
export function consume(distance: number, pixelsPerStep: number): Consumed {
	if (!Number.isFinite(distance) || !(pixelsPerStep > 0)) return { steps: 0, rest: 0 };

	// `+ 0` because `Math.trunc` answers -0 anywhere just below zero, and a -0 step count compares
	// unequal to 0 under `Object.is` and prints as `-0` wherever a caller shows it.
	const steps = Math.trunc(distance / pixelsPerStep) + 0;
	return { steps, rest: distance - steps * pixelsPerStep };
}

/**
 * How much one step is worth right now. Shift is the coarse modifier everywhere a number can be
 * dragged or nudged, so it means the same on the handle and on the arrow keys.
 */
export function amountFor(step: number, largeStep: number, coarse: boolean): number {
	return coarse ? largeStep : step;
}
