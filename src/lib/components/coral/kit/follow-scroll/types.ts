/**
 * @coral/kit/follow-scroll
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** What the `jump` snippet receives. */
export type JumpContext = {
	/** How many entries arrived unseen. `0` unless `count` is given. */
	unread: number;
	/** Something arrived while the reader was scrolled back, whether or not it can be counted. */
	behind: boolean;
	/** Goes to the end and starts following again. */
	scrollToEnd: () => void;
};

export type FollowScrollProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/**
	 * Whether the view is following the end. Bindable, and read as an instruction: set it to `true`
	 * from outside to snap back, read it to know whether the reader has scrolled away. Start it at
	 * `false` for a view that opens at the top and follows nothing until it is asked to.
	 */
	pinned?: boolean;
	/** The reader pinned or unpinned the view. Never on mount. */
	onpinnedchange?: (pinned: boolean) => void;
	/**
	 * How many entries there are. Optional, and only used to count what arrived unseen - the view
	 * follows content by height either way, so a stream with no countable entries still works.
	 */
	count?: number;
	/**
	 * How close to the end still counts as the end, in pixels. Below it, a nudge of the wheel does
	 * not stop the view following; above it, a deliberate scroll back does.
	 */
	threshold?: number;
	/** Label for the control that returns to the end. */
	jumpLabel?: string;
	/** Reads the unread count on that control. */
	unreadLabel?: (unread: number) => string;
	/** The scrolling element. Bindable - read `scrollTop` from it, or scroll it yourself. */
	ref?: HTMLDivElement | null;
	/**
	 * Merged onto the outer element, which is the one to give a height to. The scroller fills it,
	 * and sits inside so the jump control has something to be positioned against.
	 */
	class?: string;
	/** The content. */
	children: Snippet;
	/**
	 * Replaces the control that returns to the end. Rendered only while the reader is behind, and
	 * positioned by the caller - the root is the scroller, so anything inside it scrolls with the
	 * content.
	 */
	jump?: Snippet<[JumpContext]>;
};
