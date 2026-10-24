/**
 * @coral/kit/timeline
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** What the `item` snippet receives. */
export type TimelineItemContext<T> = {
	item: T;
	/** The event's moment, as a `Date`. */
	date: Date;
	/** Its position in the whole list. */
	index: number;
};

/** What the `heading` snippet receives. */
export type TimelineHeadingContext = {
	/** A moment inside the day. */
	day: Date;
	/** What the default heading prints: "Today", "Yesterday", or the formatted day. */
	label: string;
	/** Calendar days from today: `0` today, `-1` yesterday. */
	offset: number;
};

export type TimelineProps<T> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** The events, in the order they are read - newest first is the usual one. */
	items: T[];
	/** When an event happened. A date, an ISO string or a timestamp. */
	getDate: (item: T) => Date | string | number;
	/** Keys each event. Defaults to its position. */
	getKey?: (item: T, index: number) => unknown;
	/** Drives the day headings and the times. */
	locale?: string;
	/**
	 * The zone days are cut in. Left out, the reader's own, which is what a personal history wants;
	 * set it when every reader must see the same day lines, as an audit log does.
	 */
	timeZone?: string;
	/** How a day heading prints, past today and yesterday. Passed to `Intl.DateTimeFormat`. */
	dayFormat?: Intl.DateTimeFormatOptions;
	/** How each event's time prints. Passed to `Intl.DateTimeFormat`. */
	timeFormat?: Intl.DateTimeFormatOptions;
	/** The heading level each day gets, to sit under the page's own headings. */
	headingLevel?: 2 | 3 | 4 | 5 | 6;
	/** Pins the current time. For tests, previews and server-rendered snapshots. */
	now?: Date;
	/** Whether older events exist beyond the list. Shows the control that loads them. */
	hasMore?: boolean;
	/**
	 * Loads older events, which the caller appends to `items`. Return a promise and the control
	 * waits; return exactly `false`, or throw, and the list stays as it is - the convention every
	 * Coral component that waits on a request follows.
	 */
	onloadmore?: () => unknown;
	/** Receives whatever `onloadmore` threw. Without it the error is an unhandled rejection. */
	onerror?: (error: unknown) => void;
	/** Label of the control that loads older events. */
	loadMoreLabel?: string;
	/** Announced once older events have been appended. Receives how many. */
	loadedMessage?: (count: number) => string;
	/** Shown when there are no events and none to load. */
	emptyMessage?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. */
	class?: string;
	/** Merged onto each day's heading. */
	headingClass?: string;
	/** Merged onto each day's list. */
	listClass?: string;
	/** Merged onto every event row. */
	itemClass?: string;
	/** What an event says. The time beside it is Coral's. */
	item: Snippet<[TimelineItemContext<T>]>;
	/** Replaces the text of a day heading. */
	heading?: Snippet<[TimelineHeadingContext]>;
	/** Replaces the empty state. */
	empty?: Snippet;
};

/** What a project can state once for every timeline - see `lib/defaults`. */
export type TimelineDefaults = Partial<
	Pick<
		TimelineProps<unknown>,
		'timeZone' | 'dayFormat' | 'timeFormat' | 'loadMoreLabel' | 'loadedMessage' | 'emptyMessage'
	>
>;

declare global {
	interface CoralDefaults {
		'kit/timeline'?: TimelineDefaults;
	}
}

export type { DayGroup } from './days.js';
