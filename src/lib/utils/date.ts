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

export function isValidDate(value: string): boolean {
	if (!value) return false;
	const d = new Date(value);
	return !isNaN(d.getTime());
}

export function formatDate(date: string | Date, locale = 'es'): string {
	return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

export function relativeTime(date: string | Date, locale = 'es'): string {
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
