/**
 * @coral/kit/responsive-dialog
 * @version 1.0.0
 */

import { createContext } from 'svelte';

export type ResponsiveDialogState = {
	/** Whether the viewport matches the query, and a dialog is drawn instead of a drawer. */
	readonly desktop: boolean;
};

/**
 * The one thing every piece needs to know: which primitive the root chose. Read through context
 * rather than passed down, so the pieces compose the way shadcn's own dialog parts do - nested at any
 * depth, inside the caller's own markup - without a prop threaded through each one.
 */
const [getContext, setContext] = createContext<ResponsiveDialogState>();

export { setContext as setResponsiveDialog };

export function getResponsiveDialog(): ResponsiveDialogState {
	try {
		return getContext();
	} catch {
		throw new Error(
			'A responsive-dialog piece was rendered outside <ResponsiveDialog>. Wrap it in the root.'
		);
	}
}
