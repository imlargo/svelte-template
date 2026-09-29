/**
 * @coral/kit/toc
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TocHeading } from './headings.js';

/** What the `item` snippet receives. Spread `props` onto whatever link you render. */
export type TocItemContext = {
	heading: TocHeading;
	active: boolean;
	/** How deep it is, `0` for the shallowest level present - what the indentation is drawn from. */
	depth: number;
	props: Record<string, unknown>;
};

export type TocProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
	/**
	 * The headings. Leave it out and they are read from `container`, which is what a page rendering
	 * markdown or CMS HTML wants - the list follows the article instead of being kept in step by hand.
	 */
	headings?: TocHeading[];
	/** Where to read headings from. Defaults to the whole document. */
	container?: HTMLElement | null;
	/** Which elements count as headings. */
	selector?: string;
	/**
	 * The scrolling box the article lives in. Defaults to the page. Pass it when the content scrolls
	 * inside a panel, or the highlight follows a scroll position nothing is reading.
	 */
	root?: HTMLElement | null;
	/**
	 * How far below the top of that box a heading counts as reached, in pixels. Set it to the height
	 * of a sticky header, so a heading parked underneath one is not still called active.
	 */
	offset?: number;
	/** The active heading's id. Bindable, and settable to drive the highlight from elsewhere. */
	active?: string;
	/** The active heading changed. */
	onactivechange?: (id: string) => void;
	/**
	 * Whether clicking scrolls smoothly. Ignored when the reader asks for reduced motion, and when
	 * the browser is left to do the jump itself.
	 */
	smooth?: boolean;
	/** Hides the whole thing until there are at least this many headings. */
	minHeadings?: number;
	/** Names the navigation for assistive tech. */
	label?: string;
	/** The root element. Bindable. */
	ref?: HTMLElement | null;
	/** Merged onto the `<nav>`. Carries the indent knob - `[--coral-toc-indent:1.5rem]`. */
	class?: string;
	/** Merged onto every link. */
	itemClass?: string;
	/**
	 * Replaces the default label rendered above the list. Not called `title`: on a `<nav>` that is
	 * the tooltip attribute, and taking the name would cost the element something it already had.
	 */
	heading?: Snippet;
	/** Replaces each link. */
	item?: Snippet<[TocItemContext]>;
};

export type { TocHeading } from './headings.js';
