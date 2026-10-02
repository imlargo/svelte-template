/**
 * @coral/kit/activity-calendar
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Weekday } from './dates.js';
import type { ActivityCell, ActivityDay } from './grid.js';

export type LegendContext = {
	/** Intensity steps above zero. Swatch levels run `0..levels`. */
	levels: number;
	/** The fill for a level, ready to drop into a `background-color`. */
	colorFor: (level: number) => string;
	/** The cut points the levels were read from - the minimum count for each, ascending. */
	thresholds: number[];
	/** Counts summed over the drawn range. */
	total: number;
};

/**
 * `onselect` is dropped from the DOM attributes and taken over: on a `<div>` it is the
 * text-selection event, which nothing here fires, and leaving both in place merges the two
 * signatures into a handler that receives either a cell or an `Event`.
 */
export type ActivityCalendarProps<T = unknown> = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'onselect'
> & {
	/** The days. Order does not matter, gaps are drawn empty, repeats are summed. */
	data: ActivityDay<T>[];
	/** First day drawn. Defaults to the earliest day in `data`. */
	start?: string | Date;
	/** Last day drawn. Defaults to the latest day in `data`. */
	end?: string | Date;
	/** Which weekday a column starts on. `0` is Sunday; defaults to Monday. */
	weekStart?: Weekday;
	/** Intensity steps above zero. Ignored when `thresholds` is given. */
	levels?: number;
	/**
	 * Minimum count per level, ascending. Computed from the drawn range when omitted.
	 *
	 * Fix these whenever two grids sit side by side: read from their own data, each is scaled to
	 * its own busiest day, and the darker grid is not the busier one.
	 */
	thresholds?: number[];
	/** Drives the month, weekday and date labels. */
	locale?: string;
	/** The busiest fill. Any CSS colour; keep it a theme token to stay themeable. */
	color?: string;
	/** The level-zero fill - the colour of a day with nothing on it. */
	emptyColor?: string;
	showWeekdays?: boolean;
	showMonths?: boolean;
	showLegend?: boolean;
	/**
	 * Names the grid for a screen reader. Rendered as a visually hidden `<caption>`.
	 *
	 * No default, for the same reason `label` has no words in it: what the squares count is the
	 * project's to say.
	 */
	caption?: string;
	/**
	 * The text for one square - the tooltip, and the square's accessible name.
	 *
	 * Defaults to `3 · 5 ene 2026`: deliberately wordless, because `3 contributions` is copy, copy
	 * is the project's, and Coral does not know what is being counted. Pass this the moment the
	 * grid needs to say what a number means.
	 */
	label?: (cell: ActivityCell<T>) => string;
	/** Click, Enter or Space on a square. */
	onselect?: (cell: ActivityCell<T>) => void;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. Carries the size knobs - see the CSS custom properties. */
	class?: string;
	/** Merged onto every square. */
	cellClass?: string;
	/** Renders inside a square, over the fill. For marking a day, not for recolouring it. */
	cell?: Snippet<[ActivityCell<T>]>;
	/** Replaces the tooltip body. */
	tooltip?: Snippet<[ActivityCell<T>]>;
	/** Replaces the legend row. */
	legend?: Snippet<[LegendContext]>;
};

export type { Weekday } from './dates.js';
export type { ActivityCell, ActivityDay, ActivityWeek, Grid, MonthSpan } from './grid.js';
