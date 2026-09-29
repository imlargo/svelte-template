/**
 * @coral/lib/table
 * @version 1.0.0
 */

import { fold } from './fold.js';
import { collator } from './intl.js';

export type SortDirection = 'asc' | 'desc';

/** Which column a table is ordered by, and which way. */
export type Sort<Id extends string = string> = {
	column: Id;
	direction: SortDirection;
};

/**
 * The sort that follows from pressing a column header.
 *
 * Three states, not two: ascending, descending, then none. A table that can only toggle between
 * two directions has thrown away the order its rows arrived in - which is usually the order the
 * server chose, and often the one that matters. Pressing a different column starts again at
 * ascending rather than inheriting the previous direction, because carrying it over answers a
 * question nobody asked.
 */
export function nextSort<Id extends string>(
	current: Sort<Id> | undefined,
	column: Id
): Sort<Id> | undefined {
	if (current?.column !== column) return { column, direction: 'asc' };
	if (current.direction === 'asc') return { column, direction: 'desc' };
	return undefined;
}

/**
 * Orders two cell values, with `undefined` and `null` always last.
 *
 * Blanks sort last in both directions on purpose: they are the absence of a value rather than a
 * small one, and flipping them to the top on the second press buries the rows someone just asked
 * to see. Numbers and dates compare as themselves; everything else compares as text through a
 * collator, so `10` follows `9` and `Ángel` files under A.
 */
export function compare(a: unknown, b: unknown, locale?: string): number {
	if (isBlank(a) || isBlank(b)) return blanksLast(a, b);

	if (typeof a === 'number' && typeof b === 'number') return a - b;
	if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
	if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();

	return collator(locale, { numeric: true, sensitivity: 'base' }).compare(String(a), String(b));
}

/** No value at all. An empty string counts: a blank cell is blank however it got that way. */
function isBlank(value: unknown): boolean {
	return value === null || value === undefined || value === '';
}

/** Blanks after everything else, and level with each other. */
function blanksLast(a: unknown, b: unknown): number {
	if (isBlank(a) && isBlank(b)) return 0;
	return isBlank(a) ? 1 : -1;
}

export type SortOptions<T, Id extends string> = {
	/** The value a column holds for a row. Returning `undefined` sorts that row last. */
	value: (row: T, column: Id) => unknown;
	/** Drives the text collator. Left out, it follows the reader's own locale. */
	locale?: string;
	/** Per-column comparison, for an order the default cannot know - a status, a priority, a grade. */
	compare?: Partial<Record<Id, (a: T, b: T) => number>>;
};

/**
 * A sorted copy. The rows are never mutated, and the sort is stable, so rows that tie stay in the
 * order they came in and a second sort does not shuffle what the first one settled.
 */
export function sortRows<T, Id extends string>(
	rows: readonly T[],
	sort: Sort<Id> | undefined,
	{ value, locale, compare: custom }: SortOptions<T, Id>
): T[] {
	if (!sort) return [...rows];

	const direction = sort.direction === 'asc' ? 1 : -1;
	const column = custom?.[sort.column];

	return [...rows].sort((a, b) => {
		if (column) return column(a, b) * direction;

		const left = value(a, sort.column);
		const right = value(b, sort.column);

		// Decided before the direction is applied, so a blank cell stays at the bottom on the second
		// press instead of burying the rows the reader just asked to see.
		if (isBlank(left) || isBlank(right)) return blanksLast(left, right);

		return compare(left, right, locale) * direction;
	});
}

/**
 * The rows a search term leaves behind.
 *
 * Every word in the term has to appear somewhere in the row, in any field and in any order, which
 * is how a person types a search: `ana cancelled` finds Ana's cancelled row without knowing which
 * column holds which. Both sides are folded, so `acai` finds `Açaí` - the same rule the combobox
 * searches by, out of the same module.
 */
export function filterRows<T>(
	rows: readonly T[],
	term: string,
	text: (row: T) => readonly (string | number | boolean | null | undefined)[]
): T[] {
	const words = fold(term.trim()).split(/\s+/).filter(Boolean);
	if (words.length === 0) return [...rows];

	return rows.filter((row) => {
		const haystack = fold(
			text(row)
				.filter((cell) => cell !== null && cell !== undefined && cell !== '')
				.join(' ')
		);
		return words.every((word) => haystack.includes(word));
	});
}

/** How many pages `total` rows fill. Always at least one, so an empty table is page 1 of 1. */
export function pageCount(total: number, size: number): number {
	if (!(size > 0)) return 1;
	return Math.max(1, Math.ceil(total / size));
}

/**
 * Holds a page number inside the range that exists. Filtering a table down while reading page 7 is
 * the ordinary way to end up past the end, and the honest answer is the last page rather than an
 * empty screen with no explanation.
 */
export function clampPage(page: number, total: number, size: number): number {
	return Math.min(Math.max(1, Math.floor(page) || 1), pageCount(total, size));
}

/** One page of rows, 1-based. A size of zero or less means no paging at all. */
export function paginate<T>(rows: readonly T[], page: number, size: number): T[] {
	if (!(size > 0)) return [...rows];

	const start = (clampPage(page, rows.length, size) - 1) * size;
	return rows.slice(start, start + size);
}

/** Adds or removes one id, keeping the order the rest were picked in. */
export function toggleId(ids: readonly string[], id: string): string[] {
	return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}

/**
 * The ids between two rows, inclusive, in the order they are on screen - what Shift-clicking a
 * second row selects. Either end may come first, because a range is drawn in both directions.
 */
export function idsBetween(all: readonly string[], from: string, to: string): string[] {
	const start = all.indexOf(from);
	const end = all.indexOf(to);
	if (start === -1 || end === -1) return [];

	return all.slice(Math.min(start, end), Math.max(start, end) + 1);
}

/**
 * Whether the rows on screen are all, partly, or not selected - the three states the header
 * checkbox has. Read against the visible rows rather than the whole set, so the box answers for
 * what the header sits above; a page of ten selected rows shows as checked even when the filter
 * hides forty more that are not.
 */
export function selectionState(
	selected: readonly string[],
	visible: readonly string[]
): 'none' | 'some' | 'all' {
	if (visible.length === 0 || selected.length === 0) return 'none';

	const picked = visible.filter((id) => selected.includes(id)).length;
	if (picked === 0) return 'none';
	return picked === visible.length ? 'all' : 'some';
}

/**
 * The selection after the header checkbox is pressed: every visible row added, or every visible row
 * taken out, leaving anything selected elsewhere untouched.
 */
export function toggleAll(selected: readonly string[], visible: readonly string[]): string[] {
	if (selectionState(selected, visible) === 'all') {
		return selected.filter((id) => !visible.includes(id));
	}

	const missing = visible.filter((id) => !selected.includes(id));
	return [...selected, ...missing];
}
