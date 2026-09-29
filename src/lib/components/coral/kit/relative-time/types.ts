/**
 * @coral/kit/relative-time
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLTimeAttributes } from 'svelte/elements';

export type RelativeTimeContext = {
	/** The formatted label - "hace 5 minutos". */
	text: string;
	/** The full date, formatted with `titleFormat` - what the `title` shows. */
	absolute: string;
	date: Date;
};

/** Everything a `<time>` accepts - `class`, `aria-*`, `id` - stays available. */
export type RelativeTimeProps = Omit<HTMLTimeAttributes, 'children' | 'datetime'> & {
	/** The moment to describe. A date, an ISO string or a timestamp. */
	date: Date | string | number;
	/** Drives the wording and the absolute date. */
	locale?: string;
	/**
	 * `auto` says "yesterday" and "now"; `always` says "1 day ago" and "in 0 seconds". Passed to
	 * `Intl.RelativeTimeFormat`.
	 */
	numeric?: Intl.RelativeTimeFormatNumeric;
	/** `long`, `short` or `narrow` - "5 minutes ago", "5 min. ago", "5m ago". */
	format?: Intl.RelativeTimeFormatStyle;
	/** Smallest unit shown. At `minute`, anything within half a minute reads as now. */
	precision?: 'second' | 'minute';
	/** Keeps the label current as time passes. Off, it is computed once. */
	live?: boolean;
	/**
	 * How far away, in milliseconds, a date can be before it is shown as an absolute date instead.
	 * "3 years ago" is rarely what anyone wants to read about an invoice.
	 */
	cutoff?: number;
	/** How the absolute date is formatted - in the `title`, and past the `cutoff`. */
	titleFormat?: Intl.DateTimeFormatOptions;
	/** Pins the current time. For tests, previews and server-rendered snapshots. */
	now?: Date;
	/** The root element. Bindable. */
	ref?: HTMLTimeElement | null;
	/** Replaces the text inside the `<time>`. */
	children?: Snippet<[RelativeTimeContext]>;
};

export type { Relative, Unit } from './relative.js';
