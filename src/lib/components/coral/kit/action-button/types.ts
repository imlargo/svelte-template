/**
 * @coral/kit/action-button
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Button } from '$lib/components/ui/button/index.js';

/**
 * Everything the shadcn button accepts - `variant`, `size`, `type`, `form`, `aria-*`, `ref` - stays
 * available. `href` is left out, because a link navigates and has nothing to wait for; `onclick` and
 * `children` are re-declared below.
 */
type ButtonProps = Omit<ComponentProps<typeof Button>, 'href' | 'onclick' | 'children'>;

export type ActionButtonProps = ButtonProps & {
	/**
	 * Runs on click. Return a promise and the button waits on it: it reports that it is busy, and
	 * further clicks do nothing until the promise settles.
	 *
	 * Return exactly `false`, or throw, to say it did not go through - the same convention as
	 * confirm-dialog. `onsuccess` only runs when it did.
	 */
	onclick?: (event: MouseEvent) => unknown;
	/** Runs after `onclick` went through. */
	onsuccess?: () => void;
	/**
	 * Receives whatever `onclick` threw. Without it the error propagates as an unhandled rejection,
	 * which is visible in the console but to nobody using the page.
	 */
	onerror?: (error: unknown) => void;
	/** Drive the busy state yourself - a form action, a mutation tracked elsewhere. */
	pending?: boolean;
	/** Announced while busy. */
	pendingLabel?: string;
	/** The label. Receives the busy state, for a button that says "Saving..." while it waits. */
	children?: Snippet<[{ pending: boolean }]>;
};
