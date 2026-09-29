/**
 * @coral/kit/date-picker
 * @version 1.0.0
 */

import { dateTimeFormat } from '../../lib/intl.js';

/**
 * The three fields every `DateValue` carries.
 *
 * Declared structurally rather than imported: a `CalendarDate`, a `CalendarDateTime` and a
 * `ZonedDateTime` all satisfy it, so one code path formats the three of them - and the tests get
 * to pass plain objects instead of building calendar values. It is also what keeps this module
 * free of `@internationalized/date` at runtime: Coral only ever needs the day out of a `DateValue`,
 * and `Intl` does the rest.
 */
export type Day = {
	year: number;
	/** 1-based, the way `DateValue` numbers months - not the way `Date` does. */
	month: number;
	day: number;
};

/** A start and an end, either of which may be missing while the user is still picking. */
export type DayRange = {
	start: Day | undefined;
	end: Day | undefined;
};

/**
 * A calendar day as a `Date` at **local noon**. `Intl` formats a moment and a `DateValue` is not
 * one - it is a day, which becomes a moment only once you say where. Midnight is the instant a DST
 * jump can delete, and where it does the browser rolls back a day, so a picker in São Paulo shows
 * the day before the one selected. Noon is skipped nowhere.
 *
 * Deliberately not `value.toDate(getLocalTimeZone())`: the same computation behind an
 * `@internationalized/date` import, handing back midnight.
 */
export function toLocalDate(day: Day): Date {
	return new Date(day.year, day.month - 1, day.day, 12);
}

/** Whether two values name the same calendar day. Time, if either carries one, is not read. */
export function isSameDay(a: Day | undefined, b: Day | undefined): boolean {
	if (!a || !b) return a === b;
	return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Whether two ranges have the same ends. A half-picked range only matches another half-picked one. */
export function isSameRange(a: DayRange | undefined, b: DayRange | undefined): boolean {
	if (!a || !b) return a === b;
	return isSameDay(a.start, b.start) && isSameDay(a.end, b.end);
}

/** One day, formatted. */
export function formatDay(day: Day, locale: string, options: Intl.DateTimeFormatOptions): string {
	return dateTimeFormat(locale, options).format(toLocalDate(day));
}

/**
 * A range, formatted as one string.
 *
 * `formatRange` rather than two `format` calls joined by a dash, because it folds away whatever
 * the two ends share: `Jan 5 – 9, 2026`, not `Jan 5, 2026 – Jan 9, 2026`. It also
 * knows the locale's own range separator, which is not an en dash everywhere.
 *
 * A half-picked range formats as the end that exists, alone. Anything else - a trailing dash, an
 * ellipsis - is copy, and copy belongs to the project.
 */
export function formatDayRange(
	range: DayRange,
	locale: string,
	options: Intl.DateTimeFormatOptions
): string {
	const { start, end } = range;
	if (start && end) {
		return dateTimeFormat(locale, options).formatRange(toLocalDate(start), toLocalDate(end));
	}

	const only = start ?? end;
	return only ? formatDay(only, locale, options) : '';
}
