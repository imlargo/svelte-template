export function formatCurrency(amount: number, currency = 'USD', locale = 'es'): string {
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

export function formatPercent(value: number, locale = 'es'): string {
	return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(
		value
	);
}

export function formatNumber(value: number, locale = 'es'): string {
	return new Intl.NumberFormat(locale).format(value);
}
