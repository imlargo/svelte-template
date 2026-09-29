/**
 * @coral/kit/confirm-dialog
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { AlertDialog } from '$lib/components/ui/alert-dialog/index.js';
import type { ButtonVariant } from '$lib/components/ui/button/index.js';

/** Everything the shadcn alert-dialog root accepts - `open`, `onOpenChange` - stays available. */
type RootProps = Omit<ComponentProps<typeof AlertDialog>, 'children'>;

export type ConfirmDialogProps = RootProps & {
	/** The question, as a heading. Names what is about to happen. */
	title: string;
	/** What the reader needs to know before answering - what changes, and whether it is reversible. */
	description?: string;
	/** Label for the button that goes ahead. */
	confirmLabel?: string;
	/** Label for the button that backs out. */
	cancelLabel?: string;
	/**
	 * Drops the cancel button, leaving a dialog that can only be acknowledged. Escape still closes
	 * it, so this is a nudge, not a trap.
	 */
	showCancel?: boolean;
	/** Variant for the confirm button. `destructive` for anything that deletes or cannot be undone. */
	variant?: ButtonVariant;
	/**
	 * Runs when the reader confirms.
	 *
	 * Return a promise and the dialog waits: both buttons block, the confirm button reports that
	 * something is happening, and Escape stops closing it. It closes when the promise resolves.
	 *
	 * Return exactly `false` - or throw - to keep it open, which is what a failed request wants. The
	 * same convention `kit/action-button` follows. Any other return value, including none, closes
	 * it, so an existing handler can be passed straight in.
	 */
	onconfirm?: () => unknown;
	/** What `onconfirm` threw. It stays open either way; without this the error is an unhandled rejection. */
	onerror?: (error: unknown) => void;
	/**
	 * Runs when the reader backs out: the cancel button, or Escape. Not on confirm, and not when the
	 * caller closes the dialog by assigning `open` - that close is the caller's own doing.
	 */
	oncancel?: () => void;
	/**
	 * Reports that something is in flight, for callers that already track it. Leave it alone and the
	 * dialog tracks its own `onconfirm`.
	 */
	pending?: boolean;
	/** Forwarded to the shadcn content. */
	size?: 'default' | 'sm';
	/** Merged onto the content. */
	class?: string;
	/**
	 * The element that opens the dialog. Spread `props` onto it. Omit this and the dialog is opened
	 * by binding `open` instead, which is what a row menu or a table action usually needs.
	 */
	trigger?: Snippet<[{ props: Record<string, unknown> }]>;
	/** Extra content between the description and the buttons - a list of what will be affected. */
	children?: Snippet;
};
