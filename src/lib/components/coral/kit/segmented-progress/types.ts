/**
 * @coral/kit/segmented-progress
 * @version 1.0.0
 */

import type { HTMLAttributes } from 'svelte/elements';
import type { SegmentedProgressType } from './segments.js';

export type SegmentedProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** How many segments: the steps in the flow, or the levels on the scale. */
	count: number;
	/**
	 * With `type="progress"`, the step being worked on, counted from `1`; `0` is none started yet.
	 * With `type="meter"`, how many segments are lit. Held to `0`-`count`, rounded down.
	 */
	value: number;
	/**
	 * `progress` reads as a task moving through steps, and sets the current one apart. `meter` reads
	 * as a level, like a password's strength, with every segment the same.
	 */
	type?: SegmentedProgressType;
	/**
	 * What a screen reader hears. Defaults to "Step 2 of 4" for progress and "2 of 4" for a meter; a
	 * meter usually names its levels instead - "Weak", "Strong".
	 */
	valueText?: (value: number, count: number, type: SegmentedProgressType) => string;
	/** Writes the numbers in the default text. */
	locale?: string;
	/** The reached segments. Any CSS colour; keep it a theme token to stay themeable. */
	color?: string;
	/** The segments not reached yet. */
	emptyColor?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root, which sets the height and the gap: `h-2 gap-2`. */
	class?: string;
	/** Merged onto every segment. Each carries `data-state`, to style one state on its own. */
	segmentClass?: string;
};

/** What a project can state once for every segmented progress - see `lib/defaults`. */
export type SegmentedProgressDefaults = Partial<Pick<SegmentedProgressProps, 'valueText'>>;

declare global {
	interface CoralDefaults {
		'kit/segmented-progress'?: SegmentedProgressDefaults;
	}
}
