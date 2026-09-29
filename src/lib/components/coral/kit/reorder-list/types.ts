/**
 * @coral/kit/reorder-list
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/** Spread onto whatever element is dragged by. It carries the pointer and keyboard handling. */
export type HandleProps = Record<string, unknown>;

export type ItemContext<T> = {
	item: T;
	index: number;
	/** This entry is being moved, by pointer or keyboard. */
	dragging: boolean;
	/** For the `row` snippet: spread onto the element that grabs the row. */
	handle: HandleProps;
};

export type ReorderChange<T> = {
	item: T;
	from: number;
	to: number;
};

/** Where an entry is, for an announcement - 1-based, the way it is said out loud. */
export type Announce = (label: string, position: number, total: number) => string;

export type ReorderListProps<T> = Omit<HTMLAttributes<HTMLUListElement>, 'children'> & {
	/** The entries, in order. Bindable - written once per drop, never mid-drag. */
	items: T[];
	/**
	 * Identifies an entry across moves. Defaults to the entry itself, which is right for objects and
	 * unique primitives. Never an index: the index is the thing that changes.
	 */
	getKey?: (item: T) => unknown;
	/** What an entry is called, for the handle's name and the announcements. */
	getLabel?: (item: T) => string;
	/**
	 * An entry was dropped somewhere new. Once per drag, with the final order - persist here, not on
	 * every row crossed along the way. Not called for a drop back where it started, or a cancel.
	 */
	onreorder?: (items: T[], change: ReorderChange<T>) => void;
	disabled?: boolean;
	/** Accessible name of each handle. Receives the entry's label. */
	handleLabel?: (label: string) => string;
	/** Read by a screen reader when a handle is focused - how to move with the keyboard. */
	instructions?: string;
	/** Announced when an entry is picked up with the keyboard. */
	grabbed?: Announce;
	/** Announced after every keyboard move. */
	moved?: Announce;
	/** Announced on drop. */
	dropped?: Announce;
	/** Announced when a move is abandoned with Escape. Receives where it went back to. */
	cancelled?: Announce;
	/** The list element. Bindable. */
	ref?: HTMLUListElement | null;
	/** Merged onto every row. */
	itemClass?: string;
	/** The body of each row, after the default grip handle. */
	item?: Snippet<[ItemContext<T>]>;
	/** Replaces each row's contents entirely. Spread `handle` onto your own grip. */
	row?: Snippet<[ItemContext<T>]>;
};
