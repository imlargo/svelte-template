/**
 * @coral/blocks/table-panel
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Column, SelectionMode } from '../../kit/data-table/types.js';
import type { Sort, SortOptions } from '../../lib/table.js';

export type BulkContext<T> = {
	/** The selected rows themselves, not just their ids. */
	rows: T[];
	/** Their ids, in the order they were picked. */
	ids: string[];
	/** Empties the selection. Call it after the action has run. */
	clear: () => void;
};

export type RangeContext = {
	/** 1-based, and `0` when nothing matched. */
	from: number;
	to: number;
	/** How many rows survived the search. */
	matched: number;
	/** How many there are in total. */
	total: number;
};

export type TablePanelProps<T, Id extends string = string> = Omit<
	HTMLAttributes<HTMLDivElement>,
	'children'
> & {
	/** Every row there is. The panel searches, sorts and pages them - see the docs on where. */
	rows: readonly T[];
	columns: readonly Column<T, Id>[];
	getRowId: (row: T) => string;

	/** The search term. Bindable. */
	search?: string;
	/**
	 * The cells a search matches against. Defaults to every column's `value`, which is usually what
	 * is wanted; pass it to search fields that are not columns, or to leave a column out.
	 */
	searchText?: (row: T) => readonly (string | number | boolean | null | undefined)[];
	/** Drops the search field. The panel is then a table with paging and bulk actions. */
	searchable?: boolean;
	/** Placeholder for the search field. */
	searchPlaceholder?: string;

	/** Which column the rows are ordered by. Bindable. */
	sort?: Sort<Id>;
	/** Per-column comparison and locale, for an order the column values cannot express. */
	sorting?: Omit<SortOptions<T, Id>, 'value'>;

	/** The page being shown, 1-based. Bindable. */
	page?: number;
	/** Rows per page. `0` puts everything on one page and hides the paginator. Bindable. */
	pageSize?: number;
	/** The sizes the reader can choose between. Empty hides the chooser. */
	pageSizes?: number[];

	selection?: SelectionMode;
	/** Ids of the selected rows. Bindable. */
	selected?: string[];

	loading?: boolean;
	/** Heading when there are no rows at all. */
	emptyTitle?: string;
	/** Line under it - what would put something here. */
	emptyDescription?: string;
	/** Heading when a search matched nothing. A different situation, and a different sentence. */
	noResultsTitle?: string;
	/** Line under it. */
	noResultsDescription?: string;

	/** Names the table for assistive tech. */
	caption?: string;
	/** Reads the range under the table. */
	rangeLabel?: (range: RangeContext) => string;
	/** Reads how many rows are selected. */
	selectedLabel?: (count: number) => string;
	/** Label for the control that empties the selection. */
	clearLabel?: string;
	/** Label for the rows-per-page chooser. */
	pageSizeLabel?: string;

	ref?: HTMLDivElement | null;
	class?: string;
	/** Extra controls in the toolbar, beside the search field - filters, a date range, a view switch. */
	toolbar?: Snippet;
	/** What can be done to the selected rows. Only rendered while something is selected. */
	bulk?: Snippet<[BulkContext<T>]>;
};

export type { BulkContext as TablePanelBulkContext };
