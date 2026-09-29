/**
 * @coral/kit/data-table
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Sort } from '../../lib/table.js';

/** One column. `id` names it in `sort`, in `value` and wherever a cell is addressed. */
export type Column<T, Id extends string = string> = {
	id: Id;
	/** The heading. A snippet when it needs more than text - a tooltip, an icon. */
	header?: string | Snippet;
	/**
	 * The value this column holds for a row: what is shown by default, what it sorts by, and what a
	 * search matches against. Omit it for a column that only renders a snippet - actions, say.
	 */
	value?: (row: T) => string | number | boolean | Date | null | undefined;
	/** Renders the cell. Without it the column shows `value` as text. */
	cell?: Snippet<[{ row: T; index: number }]>;
	/** Whether the header offers to sort by this column. */
	sortable?: boolean;
	/** Right-aligns numbers, centres a control. Alignment is layout, so it stays a prop. */
	align?: 'start' | 'center' | 'end';
	/** Merged onto every cell in the column, and onto its header. */
	class?: string;
	/**
	 * Keeps the column out of the search `lib/table` runs, for one that holds no text worth
	 * matching - an avatar, a row of buttons.
	 */
	searchable?: boolean;
};

export type SelectionMode = 'none' | 'single' | 'multiple';

export type RowContext<T> = {
	row: T;
	index: number;
	id: string;
	selected: boolean;
};

/**
 * `onselect` is taken over from the DOM attributes: on a `<div>` it is the text-selection event,
 * and leaving both in place merges the two signatures into a handler that receives either.
 */
export type DataTableProps<T, Id extends string = string> = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children' | 'onselect'
> & {
	/** The rows to draw, already sorted, filtered and paged - see the docs on who does that. */
	rows: readonly T[];
	/** The columns, in the order they are drawn. */
	columns: readonly Column<T, Id>[];
	/**
	 * A row's identity, stable across sorts and reloads. Selection remembers these, so an index
	 * would select a different row the moment anything moves.
	 */
	getRowId: (row: T) => string;
	/** Which column the table is ordered by. Bindable. */
	sort?: Sort<Id>;
	/**
	 * The reader pressed a header. Never on mount. Sorting the rows is the caller's, so the same
	 * table serves a server that sorts and a page that sorts its own array - see `lib/table`.
	 */
	onsortchange?: (sort: Sort<Id> | undefined) => void;
	/** Whether rows can be picked, one at a time or many. */
	selection?: SelectionMode;
	/** The ids of the selected rows. Bindable. */
	selected?: string[];
	/** The selection changed. Never on mount, never when `selected` is assigned from code. */
	onselectionchange?: (selected: string[]) => void;
	/** A row was clicked or activated with Enter. Without it, rows are not clickable at all. */
	onrowactivate?: (row: T) => void;
	/** Draws placeholder rows instead of the ones it has. */
	loading?: boolean;
	/** How many placeholder rows to draw while loading. */
	loadingRows?: number;
	/** Shown when there are no rows and nothing is loading. */
	emptyMessage?: string;
	/** Names the table for assistive tech. Rendered as a visually hidden caption. */
	caption?: string;
	/** Keeps the header in view while the body scrolls. Needs a height on the scrolling parent. */
	stickyHeader?: boolean;
	/** Accessible label for the checkbox that selects every row on screen. */
	selectAllLabel?: string;
	/** Accessible label for a row's checkbox. Takes the row, because "Select" alone names none. */
	selectRowLabel?: (row: T) => string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. */
	class?: string;
	/** Merged onto every body row. */
	rowClass?: string;
	/** Replaces the empty state. */
	empty?: Snippet;
	/** Rendered below the table - pagination, a count, a bulk-action bar. */
	footer?: Snippet;
};

export type { Sort, SortDirection } from '../../lib/table.js';
