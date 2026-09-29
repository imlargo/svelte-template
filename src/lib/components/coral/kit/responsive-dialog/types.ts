/**
 * @coral/kit/responsive-dialog
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Dialog, DialogContent } from '$lib/components/ui/dialog/index.js';
import type {
	DialogClose,
	DialogDescription,
	DialogTitle,
	DialogTrigger
} from '$lib/components/ui/dialog/index.js';

export type ResponsiveDialogProps = Omit<ComponentProps<typeof Dialog>, 'children'> & {
	/**
	 * The media query that picks the dialog. Anything it does not match gets the drawer. Defaults
	 * to Tailwind's `md` breakpoint, which is also where shadcn's own examples make the switch.
	 */
	query?: string;
	/** Whether to assume the query matches before the page can measure it - on the server. */
	fallback?: boolean;
	children?: Snippet;
};

/**
 * The trigger, title, description and close are the same bits-ui parts under both primitives, so
 * their props are the dialog's and reach the drawer unchanged - `child` snippets included.
 */
export type ResponsiveDialogTriggerProps = ComponentProps<typeof DialogTrigger>;
export type ResponsiveDialogTitleProps = ComponentProps<typeof DialogTitle>;
export type ResponsiveDialogDescriptionProps = ComponentProps<typeof DialogDescription>;
export type ResponsiveDialogCloseProps = ComponentProps<typeof DialogClose>;

/**
 * The dialog's content props. `showCloseButton` only applies to the dialog: a drawer is closed by
 * dragging it down or tapping outside, and has no corner for a button.
 */
export type ResponsiveDialogContentProps = ComponentProps<typeof DialogContent>;

export type ResponsiveDialogSectionProps = HTMLAttributes<HTMLDivElement> & {
	ref?: HTMLElement | null;
};
