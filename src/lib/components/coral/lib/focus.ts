/**
 * @coral/lib/focus
 * @version 1.0.0
 */

/**
 * The outline for a control Coral draws itself, where no primitive supplies a focus style. It is
 * `focus-visible`, so a pointer press leaves no ring behind.
 */
export const focusRing = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring';

/** For a row inside a box that clips, where an outset ring would be cut off. */
export const focusRingInset =
	'-outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring';

/** For a mark small enough that a full-size gap would swallow its neighbours. */
export const focusRingTight = 'outline-offset-1 focus-visible:outline-2 focus-visible:outline-ring';

/** For a wrapper whose focusable part is a visually hidden input inside it, such as a star. */
export const focusRingWithin =
	'outline-offset-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring';
