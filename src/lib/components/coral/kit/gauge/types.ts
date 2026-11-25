/**
 * @coral/kit/gauge
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** What the `children` snippet receives, to draw the middle of the gauge itself. */
export type GaugeContext = {
	/** The value as passed, unclamped. */
	value: number;
	/** How far along the range it is, `0` to `1`. */
	fraction: number;
	/** The value written in `locale` and `format` - what the default middle shows. */
	text: string;
};

export type GaugeProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** The reading. Drawn clamped to the range; the text still says what it really is. */
	value: number;
	/** Where the arc starts. */
	min?: number;
	/** Where the arc is full. */
	max?: number;
	/**
	 * How much of a circle the arc covers, in degrees. Anything short of `360` opens at the bottom;
	 * `360` is a ring that starts at twelve o'clock.
	 */
	sweep?: number;
	/** How wide the stroke is, in hundredths of the gauge's width. */
	thickness?: number;
	/** Drives the number in the middle and in what a screen reader hears. */
	locale?: string;
	/**
	 * How the value is written, passed to `Intl.NumberFormat`: `{ style: 'percent' }`, `{ style:
	 * 'unit', unit: 'gigabyte' }`. With `percent` the value is the fraction, so give it `max={1}`.
	 */
	format?: Intl.NumberFormatOptions;
	/** The filled part. Any CSS colour; keep it a theme token to stay themeable. */
	color?: string;
	/** The colour of the part that is not filled. */
	emptyColor?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. Carries the size knob - `[--coral-gauge:--spacing(24)]`. */
	class?: string;
	/** Merged onto the box in the middle that holds the value. */
	contentClass?: string;
	/** Replaces what the middle shows. A screen reader still hears `text`, through the meter. */
	children?: Snippet<[GaugeContext]>;
};
