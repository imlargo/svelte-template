/**
 * @coral/kit/activity-calendar
 * @version 1.0.1
 */

/** Which weekday a week starts on. `0` is Sunday, the way `Date#getDay` numbers them. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const CALENDAR_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A day, normalized to **local noon**. Both decisions here are bugs in every hand-written grid
 * worth comparing against:
 *
 * - **`YYYY-MM-DD` is parsed by hand**, because `new Date('2026-01-05')` means UTC midnight - the
 *   4th at 19:00 in any UTC-5 zone, so a naive grid draws every day one square early, all year, and
 *   only in negative-offset zones. A bare day means that day where the reader is; anything carrying
 *   a time is a moment, and its local day is read off the clock.
 * - **Noon, not midnight**, which is the one instant a DST jump can delete - and where it does,
 *   the browser rolls the date back a day. Noon is skipped nowhere on earth.
 */
export function toDate(value: string | Date): Date {
	if (typeof value === 'string') {
		const parts = CALENDAR_DAY.exec(value);
		if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]), 12);
	}

	const moment = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(moment.getTime())) throw new Error(`Invalid activity date: ${String(value)}`);
	return new Date(moment.getFullYear(), moment.getMonth(), moment.getDate(), 12);
}

/** `YYYY-MM-DD` read off the local clock, so it round-trips through `toDate` unchanged. */
export function toKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** The same time of day, `days` later. Negative goes back. */
export function addDays(date: Date, days: number): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

/** The `weekStart` on or before `date`. */
export function startOfWeek(date: Date, weekStart: Weekday): Date {
	return addDays(date, -(((date.getDay() - weekStart) % 7) + 7) % 7);
}

/**
 * The date that falls on row `row` of a week starting at `weekStart` - any such date, since only
 * its weekday is ever read.
 *
 * Used to name the row headings: 2024-01-01 was a Monday, so offsetting from it lands on the
 * wanted weekday whatever the locale, and `Intl` does the naming. The alternative is a table of
 * weekday names per language, which is the thing `Intl` exists to replace.
 */
export function weekdayAt(weekStart: Weekday, row: number): Date {
	const MONDAY = 1;
	return new Date(2024, 0, 1 + ((((weekStart + row - MONDAY) % 7) + 7) % 7), 12);
}
