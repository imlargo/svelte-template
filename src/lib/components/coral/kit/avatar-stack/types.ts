/**
 * @coral/kit/avatar-stack
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { AvatarGroup } from '$lib/components/ui/avatar/index.js';

/** What the default avatar reads from an item. The same fields `kit/avatar` takes. */
export type AvatarStackPerson = {
	name?: string;
	src?: string;
	alt?: string;
};

export type AvatarContext<T> = {
	item: T;
	index: number;
};

export type OverflowContext<T> = {
	/** Everyone folded into the count, in order. */
	hidden: T[];
	count: number;
	/** The accessible label the default count uses - put it on whatever replaces it. */
	label: string;
};

/** Everything the shadcn group accepts - `class`, `aria-*`, `ref` - stays available. */
type GroupProps = Omit<ComponentProps<typeof AvatarGroup>, 'children'>;

export type AvatarStackProps<T> = GroupProps & {
	/** Who to show, in order. */
	items: T[];
	/**
	 * How many circles the stack takes up, the count included. Omitted, everyone is drawn. A count
	 * of `+1` never appears: that slot draws the one person instead.
	 */
	max?: number;
	/** Maps an item to what the default avatar reads. Identity by default. */
	getPerson?: (item: T) => AvatarStackPerson;
	/** Keys each avatar. Defaults to its position. */
	getKey?: (item: T, index: number) => unknown;
	/** Forwarded to every avatar, and matched by the count. */
	size?: 'default' | 'sm' | 'lg';
	/** Names the stack as a whole - "Assignees", "Viewing this document". */
	label?: string;
	/** Accessible label for the count. Receives how many are hidden. */
	overflowLabel?: (count: number) => string;
	/** Replaces each avatar. Render an avatar whose root is the direct child, so the overlap applies. */
	avatar?: Snippet<[AvatarContext<T>]>;
	/**
	 * Replaces the count - to wrap it in a tooltip or a popover that lists the rest. Render an
	 * `AvatarGroupCount` so it keeps its place in the overlap.
	 */
	overflow?: Snippet<[OverflowContext<T>]>;
};
