/**
 * Date and time range utilities.
 */

export type TimeFilter =
	| 'today'
	| 'yesterday'
	| 'last_7_days'
	| 'last_30_days'
	| 'last_90_days'
	| 'this_month'
	| 'last_month'
	| 'this_year'
	| 'last_year'
	| 'all_time';

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
	today: 'Hoy',
	yesterday: 'Ayer',
	last_7_days: 'Últimos 7 días',
	last_30_days: 'Últimos 30 días',
	last_90_days: 'Últimos 90 días',
	this_month: 'Este mes',
	last_month: 'Mes anterior',
	this_year: 'Este año',
	last_year: 'Año anterior',
	all_time: 'Todo el tiempo'
};

export function timeFilterLabel(filter: TimeFilter): string {
	return TIME_FILTER_LABELS[filter] ?? filter;
}

/**
 * Returns true if the given string is a valid ISO date (YYYY-MM-DD or full ISO 8601).
 */
export function isValidDate(value: string): boolean {
	if (!value) return false;
	const d = new Date(value);
	return !isNaN(d.getTime());
}
