/**
 * @coral/kit/show-more
 * @version 1.0.1
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** What the `toggle` snippet receives. Spread `props` onto the button you render. */
export type ToggleContext = {
	props: Record<string, unknown>;
	expanded: boolean;
	toggle: () => void;
};

export type ShowMoreProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** How many lines show while collapsed, measured in the content's own line height. */
	lines?: number;
	/** Whether everything is showing. Bindable. */
	expanded?: boolean;
	/** Called when the reader expands or collapses. Never on mount, never when set from code. */
	onexpandedchange?: (expanded: boolean) => void;
	/** Label of the default toggle while collapsed. */
	moreLabel?: string;
	/** Label of the default toggle while expanded. */
	lessLabel?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. */
	class?: string;
	/** Merged onto the clipped region. */
	contentClass?: string;
	/** The content to clamp. Anything - text, a list, markup from a CMS. */
	children: Snippet;
	/** Replaces the toggle button. Only rendered when the content actually overflows. */
	toggle?: Snippet<[ToggleContext]>;
};
