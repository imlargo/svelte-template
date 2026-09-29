/**
 * @coral/kit/page-state
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PageStateKind } from './delay.js';

export type ErrorContext = {
	/** Whatever was handed to `error`. */
	error: unknown;
	/** Runs `onretry`. The same path the default button takes. */
	retry: () => void;
	/** A retry is in flight. */
	retrying: boolean;
};

export type PageStateProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** Something is being fetched. */
	loading?: boolean;
	/** What went wrong, or nothing. Anything truthy counts, so the error itself can be passed. */
	error?: unknown;
	/** There is nothing to show. Read only once loading has finished and nothing failed. */
	empty?: boolean;
	/**
	 * Runs when the reader asks to try again. Async-aware: the button waits on it and stays put if it
	 * fails, the convention every Coral component that waits on a request follows. Without it, no
	 * retry button is drawn.
	 */
	onretry?: () => unknown;
	/** What `onretry` threw; the error state stays. Named for what failed, since `error` is already a prop. */
	onretryerror?: (error: unknown) => void;
	/**
	 * How long a wait has to last before anything is drawn for it, in milliseconds. Requests that
	 * finish inside this window draw nothing at all.
	 */
	delay?: number;
	/**
	 * How long the loading state stays once drawn, in milliseconds. What stops an indicator that
	 * appeared for one frame from blinking straight back out.
	 */
	minimum?: number;
	/** Heading for the empty state. */
	emptyTitle?: string;
	/** Line under it - what would put something here. */
	emptyDescription?: string;
	/** Heading for the error state. */
	errorTitle?: string;
	/** Line under it. */
	errorDescription?: string;
	/** Label for the retry button. */
	retryLabel?: string;
	/**
	 * Which state is showing. Bindable, for a caller that wants to know.
	 *
	 * Not called `state`: a prop by that name shadows the `$state` rune inside the component, and
	 * Svelte reads `$state` as a subscription to it instead.
	 */
	status?: PageStateKind;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. */
	class?: string;
	/** The content, shown once there is something to show. */
	children: Snippet;
	/** Replaces the loading state - skeleton rows that match the content, usually. */
	loadingState?: Snippet;
	/** Replaces the empty state. */
	emptyState?: Snippet;
	/** Replaces the error state. */
	errorState?: Snippet<[ErrorContext]>;
};

export type { PageStateKind } from './delay.js';
