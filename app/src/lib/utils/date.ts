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
	today: 'Today',
	yesterday: 'Yesterday',
	last_7_days: 'Last 7 days',
	last_30_days: 'Last 30 days',
	last_90_days: 'Last 90 days',
	this_month: 'This month',
	last_month: 'Last month',
	this_year: 'This year',
	last_year: 'Last year',
	all_time: 'All time'
};

export function timeFilterLabel(filter: TimeFilter): string {
	return TIME_FILTER_LABELS[filter] ?? filter;
}

export function isValidDate(value: string): boolean {
	if (!value) return false;
	const d = new Date(value);
	return !isNaN(d.getTime());
}

export function formatDate(date: string | Date, locale = 'en'): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

export function relativeTime(date: string | Date, locale = 'en'): string {
	const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
	const diff = (new Date(date).getTime() - Date.now()) / 1000;
	const abs = Math.abs(diff);
	if (abs < 60) return rtf.format(Math.round(diff), 'second');
	if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
	if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
	return rtf.format(Math.round(diff / 86400), 'day');
}

export function isExpired(date: string | Date): boolean {
	return new Date(date).getTime() < Date.now();
}
