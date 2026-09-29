/**
 * @coral/blocks/table-panel
 * @version 1.0.0
 */

import { clampPage, filterRows, pageCount, paginate, sortRows } from '../../lib/table.js';
import type { Sort, SortOptions } from '../../lib/table.js';

export type PanelOptions<T, Id extends string> = {
	rows: readonly T[];
	/** The search term, as typed. */
	term: string;
	/** The cells a search matches against. */
	text: (row: T) => readonly (string | number | boolean | null | undefined)[];
	sort: Sort<Id> | undefined;
	/** How a column reads a row, and any comparison the default cannot know. */
	sorting: SortOptions<T, Id>;
	page: number;
	/** Rows per page. `0` or less means one page with everything on it. */
	pageSize: number;
};

export type Panel<T> = {
	/** The rows to draw: filtered, sorted, and cut to the page. */
	rows: T[];
	/** Every row that matched the search, before paging. Bulk actions act on these. */
	matched: T[];
	/** How many rows there are in total, before the search. */
	total: number;
	/** The page actually being shown, which may not be the one that was asked for. */
	page: number;
	pages: number;
	/** 1-based, for "1-10 of 42". Both are `0` when nothing matched. */
	from: number;
	to: number;
	/** A search is narrowing the list, which is what tells an empty table why it is empty. */
	searching: boolean;
};

/**
 * The whole pipeline, in the one order that is correct: filter, then sort, then cut to the page.
 *
 * Sorting before filtering wastes the work; paging before either is the bug worth naming, because
 * it is the one that looks like it works. Page 1 of an unfiltered list is 10 rows, the search runs
 * over those 10, and a table of 400 rows quietly searches the first page only.
 *
 * The page is clamped last, against the rows that survived: filtering a list down while reading
 * page 7 is the ordinary way to end up past the end, and the honest answer is the last page rather
 * than an empty table under a paginator that says there are more.
 */
export function buildPanel<T, Id extends string>({
	rows,
	term,
	text,
	sort,
	sorting,
	page,
	pageSize
}: PanelOptions<T, Id>): Panel<T> {
	const searching = term.trim() !== '';
	const matched = sortRows(filterRows(rows, term, text), sort, sorting);

	const current = clampPage(page, matched.length, pageSize);
	const size = pageSize > 0 ? pageSize : matched.length;

	return {
		rows: paginate(matched, current, pageSize),
		matched,
		total: rows.length,
		page: current,
		pages: pageCount(matched.length, pageSize),
		from: matched.length === 0 ? 0 : (current - 1) * size + 1,
		to: Math.min(current * size, matched.length),
		searching
	};
}
