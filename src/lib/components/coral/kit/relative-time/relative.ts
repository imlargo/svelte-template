/**
 * @coral/kit/relative-time
 * @version 1.0.0
 */

export type Unit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** The average Gregorian month and year. A relative label is approximate by nature. */
const MONTH = 30.436875 * DAY;
const YEAR = 365.2425 * DAY;

/**
 * Each unit, its length, and how many of it are shown before moving up to the next one. `week`
 * gives way at 4, so "4 weeks ago" never sits next to "1 month ago" meaning roughly the same day.
 */
const LADDER: { unit: Unit; size: number; limit: number }[] = [
	{ unit: 'second', size: SECOND, limit: 60 },
	{ unit: 'minute', size: MINUTE, limit: 60 },
	{ unit: 'hour', size: HOUR, limit: 24 },
	{ unit: 'day', size: DAY, limit: 7 },
	{ unit: 'week', size: WEEK, limit: 4 },
	{ unit: 'month', size: MONTH, limit: 12 },
	{ unit: 'year', size: YEAR, limit: Number.POSITIVE_INFINITY }
];

export type Relative = {
	/** Signed: negative in the past, as `Intl.RelativeTimeFormat` expects. `0` is "now". */
	value: number;
	unit: Unit;
};

export function toDate(input: Date | string | number): Date {
	return input instanceof Date ? input : new Date(input);
}

/**
 * Magnitude rounded half away from zero. `Math.round(-2.5)` is `-2`, so rounding the signed number
 * would make "2.5 minutes ago" read as 2 and "in 2.5 minutes" as 3 - the same distance, labelled
 * differently depending on which side of now it falls.
 */
function roundMagnitude(ms: number, size: number): number {
	return Math.round(Math.abs(ms) / size);
}

/**
 * The value and unit that describe how far `date` is from `now`.
 *
 * The unit is chosen on the rounded value, not the raw one, so 59 minutes and 40 seconds is "1 hour
 * ago" rather than "60 minutes ago". `precision` is the smallest unit used: at `minute`, anything
 * within half a minute is `0`, which formats as "now" - a label that ticks every second draws the
 * eye to a timestamp for no reason.
 */
export function describe(
	date: Date,
	now: Date,
	precision: 'second' | 'minute' = 'minute'
): Relative {
	const diff = date.getTime() - now.getTime();
	if (!Number.isFinite(diff)) return { value: 0, unit: 'second' };

	const sign = diff < 0 ? -1 : 1;
	const start = precision === 'minute' ? 1 : 0;

	for (let step = start; step < LADDER.length; step++) {
		const { unit, size, limit } = LADDER[step];
		const magnitude = roundMagnitude(diff, size);
		if (magnitude === 0) return { value: 0, unit: 'second' };
		if (magnitude < limit) return { value: sign * magnitude, unit };
	}

	return { value: sign * roundMagnitude(diff, YEAR), unit: 'year' };
}

/** The shortest wait a scheduler is allowed, so a boundary landing on the same tick cannot spin. */
const MIN_DELAY = SECOND;
/** `setTimeout` overflows past 2^31 - 1 ms and fires immediately; a day is plenty anyway. */
const MAX_DELAY = DAY;

/**
 * Milliseconds until the label for `date` would change - the next moment the rounded value, or the
 * unit, is different.
 *
 * This is what lets a list of two hundred timestamps stay current without two hundred intervals
 * firing every second: each one sleeps until its own text actually changes, which for "3 days ago"
 * is hours away.
 *
 * Going into the past, moving up a unit always coincides with a rounding boundary of the unit below,
 * so the current unit's own boundary is enough. Counting down to a future date it is not: "in 1
 * hour" becomes "in 59 minutes" at 59.5 minutes out, long before the hour would round down to zero,
 * so the step down to the smaller unit is a second boundary to wait for.
 */
export function nextChange(
	date: Date,
	now: Date,
	precision: 'second' | 'minute' = 'minute'
): number {
	const diff = date.getTime() - now.getTime();
	if (!Number.isFinite(diff)) return MAX_DELAY;

	const { unit } = describe(date, now, precision);
	// "now" is the smallest unit rounding to zero; its next change is when it rounds to one.
	const size = LADDER.find((rung) => rung.unit === unit)?.size ?? SECOND;
	const scale = unit === 'second' && precision === 'minute' ? MINUTE : size;

	const distance = Math.abs(diff);
	const magnitude = Math.round(distance / scale);

	let wait: number;
	if (diff <= 0) {
		// In the past, the distance grows: the label changes once it reaches the next half step.
		wait = (magnitude + 0.5) * scale - distance;
	} else {
		// In the future it shrinks, and crossing below the previous half step is what changes it.
		// Once that step would be below zero, the next change is the moment itself.
		wait = magnitude > 0 ? distance - (magnitude - 0.5) * scale + 1 : distance + 1;

		const index = LADDER.findIndex((rung) => rung.unit === unit);
		const below = index > (precision === 'minute' ? 1 : 0) ? LADDER[index - 1] : undefined;
		if (below) {
			const stepDown = (below.limit - 0.5) * below.size;
			if (distance >= stepDown) wait = Math.min(wait, distance - stepDown + 1);
		}
	}

	return Math.min(MAX_DELAY, Math.max(MIN_DELAY, Math.ceil(wait)));
}
