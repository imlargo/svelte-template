/**
 * @coral/kit/segmented-progress
 * @version 1.0.0
 */

export type SegmentedProgressType = 'progress' | 'meter';

/**
 * A progress segment is done, the step being worked on, or still ahead. A meter segment is only
 * lit or not: a level has no "current".
 */
export type SegmentState = 'complete' | 'current' | 'upcoming' | 'filled' | 'empty';

/**
 * Whole segments only, and the value held inside them. A fractional value rounds down, so a
 * segment is never drawn reached before it is; anything that is not a finite number counts as none.
 */
export function rangeOf(count: number, value: number): { count: number; value: number } {
	const segments = Number.isFinite(count) ? Math.max(Math.floor(count), 0) : 0;
	const reached = Number.isFinite(value) ? Math.floor(value) : 0;
	return { count: segments, value: Math.min(Math.max(reached, 0), segments) };
}

/** The state of the segment at `index`, zero-based, for a `value` already passed through `rangeOf`. */
export function stateOf(index: number, value: number, type: SegmentedProgressType): SegmentState {
	if (type === 'meter') return index < value ? 'filled' : 'empty';
	if (index < value - 1) return 'complete';
	return index === value - 1 ? 'current' : 'upcoming';
}
