/**
 * @coral/kit/timeline
 * @version 1.0.0
 */

import { dateTimeFormat } from '../../lib/intl.js';

/** A run of events that fell on the same calendar day, in the order they were given. */
export type DayGroup<T> = {
	/** The day as `YYYY-MM-DD` in the zone the grouping was done in. */
	key: string;
	/** A moment inside that day - the first event's - for formatting the heading. */
	day: Date;
	items: { item: T; date: Date }[];
};

export function toDate(input: Date | string | number): Date {
	return input instanceof Date ? input : new Date(input);
}

/**
 * The calendar day a moment falls on, where the reader is - or in `timeZone` when the product has
 * one day for everybody. Read off `Intl` rather than `getDate()`, which only knows the machine's
 * zone, and never off an ISO string, which is UTC and splits an evening in two around midnight.
 */
export function dayKey(date: Date, timeZone?: string): string {
	const parts = dateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);
	const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Whole days from `from` to `to`, as calendar days: yesterday is -1 whatever the hour. */
export function daysBetween(from: string, to: string): number {
	const [fy, fm, fd] = from.split('-').map(Number);
	const [ty, tm, td] = to.split('-').map(Number);
	return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/**
 * Consecutive events sharing a day, grouped. Consecutive, not sorted: the order is the caller's -
 * newest first is the usual one - and a list that reorders what it was handed hides a sorting bug
 * instead of showing it.
 */
export function groupByDay<T>(
	items: readonly T[],
	getDate: (item: T) => Date | string | number,
	timeZone?: string
): DayGroup<T>[] {
	const groups: DayGroup<T>[] = [];

	for (const item of items) {
		const date = toDate(getDate(item));
		const key = dayKey(date, timeZone);
		const last = groups.at(-1);
		if (last?.key === key) last.items.push({ item, date });
		else groups.push({ key, day: date, items: [{ item, date }] });
	}

	return groups;
}
