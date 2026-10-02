/**
 * @coral/kit/page-state
 * @version 1.0.0
 */

export type Window = {
	/** How long a wait has to last before anything is drawn for it, in milliseconds. */
	delay: number;
	/** Once drawn, how long it stays, in milliseconds. */
	minimum: number;
};

/**
 * When the indicator for a wait that started at `since` should appear, and when it may go again.
 *
 * Two numbers, for the two ways a loading state goes wrong. Showing it immediately makes every
 * fast request flash a spinner the reader cannot read and did not need. Hiding it the instant the
 * data lands makes a spinner that appeared for 30ms flash *again*, which is worse - the eye
 * catches the blink without ever resolving what it was.
 *
 * So: nothing is drawn for the first `delay`, and anything drawn stays for at least `minimum`.
 * A request that finishes inside the delay window draws nothing at all.
 */
export function shownFrom(since: number, { delay }: Window): number {
	return since + Math.max(0, delay);
}

export function hiddenFrom(shownAt: number, { minimum }: Window): number {
	return shownAt + Math.max(0, minimum);
}

/**
 * How long to wait before acting on a change, given the clock now. Never negative, so a caller can
 * pass it straight to `setTimeout` without checking.
 */
export function waitUntil(moment: number, now: number): number {
	return Math.max(0, moment - now);
}

/** What a screen is showing, once the timing above has had its say. */
export type PageStateKind = 'idle' | 'loading' | 'error' | 'empty' | 'content';

export type Conditions = {
	loading: boolean;
	/** Anything truthy counts as an error, so a caller can pass the error itself. */
	error: unknown;
	empty: boolean;
	/**
	 * Whether the indicator is currently drawn: true once the wait has lasted longer than `delay`,
	 * and still true until its `minimum` is up, which may be after the data has already landed.
	 */
	showLoading: boolean;
};

/**
 * Which state a screen is in.
 *
 * The order is the part worth fixing in one place: an error outranks a reload, or a failed refresh
 * flickers back to a spinner and the reader never finds out what went wrong. A wait that has not
 * earned its indicator yet keeps whatever was on screen - `idle` on first load, the previous rows
 * on a refresh - instead of blanking the page for 80ms.
 */
export function stateOf({ loading, error, empty, showLoading }: Conditions): PageStateKind {
	if (error) return 'error';

	// Drawn beats loading, in both directions. A wait that has not earned its indicator keeps
	// whatever was on screen; an indicator that has been drawn stays until its minimum is up, even
	// though the rows it was waiting for are already here.
	if (showLoading) return 'loading';
	if (loading) return 'idle';

	if (empty) return 'empty';
	return 'content';
}
