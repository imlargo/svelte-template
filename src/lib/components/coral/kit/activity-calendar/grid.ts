/**
 * @coral/kit/activity-calendar
 * @version 1.0.0
 */

import { addDays, startOfWeek, toDate, toKey } from './dates.js';
import { levelFor, thresholdsFor } from './levels.js';
import type { Weekday } from './dates.js';

/** One day of the source data. Days the caller does not mention are drawn empty, not skipped. */
export type ActivityDay<T = unknown> = {
	/**
	 * `YYYY-MM-DD` for a calendar day, or a `Date`/timestamp string for a moment in time.
	 *
	 * The two are read differently on purpose - see `toDate`.
	 */
	date: string | Date;
	count: number;
	/** Overrides the computed intensity for this day. Use it when the server already bucketed. */
	level?: number;
	/** Anything the project wants back in the tooltip or on select. Coral never reads it. */
	meta?: T;
};

/** One square of the grid. */
export type ActivityCell<T = unknown> = {
	/** Local noon of the day - see `toDate` for why noon. */
	date: Date;
	/** `YYYY-MM-DD`, in local time. Unique across the grid, so it doubles as the DOM key. */
	key: string;
	count: number;
	level: number;
	meta?: T;
	/** Column, left to right. */
	week: number;
	/** Row, top to bottom. Zero is `weekStart`, not Sunday. */
	weekday: number;
	/** Position in `Grid.cells` - chronological, and what keyboard movement steps through. */
	index: number;
};

/** One column. Always seven slots; `null` where the column runs past either end of the range. */
export type ActivityWeek<T = unknown> = {
	key: string;
	days: (ActivityCell<T> | null)[];
};

/** A run of consecutive columns belonging to the same month. Spans add up to the column count. */
export type MonthSpan = {
	key: string;
	/** The first day of the run's first column, for formatting. */
	date: Date;
	span: number;
};

export type Grid<T = unknown> = {
	weeks: ActivityWeek<T>[];
	months: MonthSpan[];
	/** Every cell in range, chronological. */
	cells: ActivityCell<T>[];
	start: Date;
	end: Date;
	/** Sum of the counts that fell inside the range. */
	total: number;
	/** The cut points the levels were read from, whether given or computed. */
	thresholds: number[];
};

export type BuildOptions = {
	start?: string | Date;
	end?: string | Date;
	/** Which weekday the columns start on. `0` is Sunday. */
	weekStart?: Weekday;
	/** How many intensity steps above zero. Ignored when `thresholds` is given. */
	levels?: number;
	/** Minimum count for each level, ascending. Computed from the data when omitted. */
	thresholds?: number[];
};

type Entry<T> = { count: number; level?: number; meta?: T };

/**
 * Folds the source days into the rectangular grid the component draws. Duplicate dates are summed
 * rather than overwritten: activity arrives as events - three commits on Tuesday are three rows -
 * and every wrapper that keys them into a map instead silently keeps the last.
 */
export function buildGrid<T>(days: ActivityDay<T>[], options: BuildOptions = {}): Grid<T> {
	const { weekStart = 1, levels = 4 } = options;

	const entries = new Map<string, Entry<T>>();
	for (const day of days) {
		const key = toKey(toDate(day.date));
		const previous = entries.get(key);
		entries.set(key, {
			count: (previous?.count ?? 0) + day.count,
			level: day.level ?? previous?.level,
			meta: day.meta ?? previous?.meta
		});
	}

	const keys = [...entries.keys()].sort();
	const start = options.start ? toDate(options.start) : keys.length > 0 ? toDate(keys[0]) : null;
	const end = options.end
		? toDate(options.end)
		: keys.length > 0
			? toDate(keys[keys.length - 1])
			: null;

	if (!start || !end || start > end) {
		return {
			weeks: [],
			months: [],
			cells: [],
			start: start ?? new Date(NaN),
			end: end ?? new Date(NaN),
			total: 0,
			thresholds: options.thresholds ?? []
		};
	}

	const from = toKey(start);
	const to = toKey(end);
	const thresholds =
		options.thresholds ??
		thresholdsFor(
			// Only what the range shows: a cut read from days that are not drawn would shade the
			// visible ones against a scale nobody can see.
			keys.filter((key) => key >= from && key <= to).map((key) => entries.get(key)!.count),
			levels
		);

	const weeks: ActivityWeek<T>[] = [];
	const cells: ActivityCell<T>[] = [];
	let total = 0;

	for (let cursor = startOfWeek(start, weekStart); cursor <= end; cursor = addDays(cursor, 7)) {
		const week: ActivityWeek<T> = {
			key: toKey(cursor),
			// Seven slots from the start, so a column that begins or ends mid-week keeps its shape
			// and every row of the table has the same number of cells.
			days: new Array<ActivityCell<T> | null>(7).fill(null)
		};

		for (let weekday = 0; weekday < 7; weekday++) {
			const date = addDays(cursor, weekday);
			if (date < start || date > end) continue;

			const key = toKey(date);
			const entry = entries.get(key);
			const count = entry?.count ?? 0;
			total += count;

			const cell: ActivityCell<T> = {
				date,
				key,
				count,
				level: entry?.level ?? levelFor(count, thresholds),
				meta: entry?.meta,
				week: weeks.length,
				weekday,
				index: cells.length
			};
			cells.push(cell);
			week.days[weekday] = cell;
		}

		weeks.push(week);
	}

	return { weeks, months: monthsOf(weeks), cells, start, end, total, thresholds };
}

/**
 * Groups the columns into month runs. A column belongs to the month of its first drawn day, so a
 * run begins at the first column that month reaches - which puts the label over the block it names
 * rather than one column early whenever a month starts mid-week.
 */
function monthsOf<T>(weeks: ActivityWeek<T>[]): MonthSpan[] {
	const months: MonthSpan[] = [];

	for (const week of weeks) {
		const first = week.days.find((day) => day !== null);
		if (!first) continue;

		const key = `${first.date.getFullYear()}-${first.date.getMonth()}`;
		const open = months[months.length - 1];
		if (open?.key === key) open.span += 1;
		else months.push({ key, date: first.date, span: 1 });
	}

	return months;
}

/**
 * How far a key moves along the chronological list of cells. Columns are weeks, so sideways is
 * seven days; in a right-to-left page the first week is on the right, so that pair swaps.
 */
export function stepFor(key: string, rtl = false): number | undefined {
	const sideways = rtl ? -7 : 7;

	switch (key) {
		case 'ArrowLeft':
			return -sideways;
		case 'ArrowRight':
			return sideways;
		case 'ArrowUp':
			return -1;
		case 'ArrowDown':
			return 1;
		default:
			return undefined;
	}
}
