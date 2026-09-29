/**
 * @coral/kit/copy-button
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Button } from '$lib/components/ui/button/index.js';
import type { CopySource } from './clipboard.js';

/** Where a copy stands. `copied` and `failed` fall back to `idle` after `timeout`. */
export type CopyStatus = 'idle' | 'copying' | 'copied' | 'failed';

/**
 * Everything the shadcn button accepts - `variant`, `size`, `disabled`, `aria-*`, `ref` - stays
 * available. `href` is left out: a link that copies is a button dressed as a link, and the
 * primitive renders an `<a>` for it that has no business intercepting a click.
 */
type ButtonProps = Omit<ComponentProps<typeof Button>, 'href' | 'onclick' | 'children'>;

export type CopyButtonProps = ButtonProps & {
	/**
	 * Runs before the copy. Call `preventDefault` on the event to skip the copy - a caller that
	 * needs to confirm first, or has nothing to copy yet.
	 */
	onclick?: (event: MouseEvent) => void;
	/** What gets copied. A function runs on click, so the text can be computed or fetched then. */
	text: CopySource;
	/** How long `copied` or `failed` shows before going back to `idle`, in milliseconds. */
	timeout?: number;
	/** Where the copy stands. Bindable, so something beside the button can react to it. */
	status?: CopyStatus;
	/** The text reached the clipboard. Receives it resolved, so a function source can be logged. */
	oncopy?: (text: string) => void;
	/**
	 * The copy did not go through - a denied permission, an insecure context with no fallback, or a
	 * `text` function that threw. Without this a failure only shows as the `failed` state.
	 */
	onerror?: (error: unknown) => void;
	/** Accessible name while idle. Only used when there is no visible text. */
	label?: string;
	/** Announced when the copy succeeds. */
	copiedLabel?: string;
	/** Announced when it fails. */
	failedLabel?: string;
	/**
	 * Replaces the icon. Receives the status, so the button can say "Copy link" and "Copied!" in
	 * words. With visible text the accessible name comes from it, and `label` is not applied.
	 */
	children?: Snippet<[{ status: CopyStatus }]>;
};

export type { CopySource } from './clipboard.js';
