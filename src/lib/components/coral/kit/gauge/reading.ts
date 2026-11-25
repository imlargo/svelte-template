/**
 * @coral/kit/gauge
 * @version 1.0.0
 */

/**
 * The value as a gauge writes it, which never claims a bound the reading has not reached.
 *
 * Rounded the ordinary way, a disk 99.6% full reads `100%` and one 0.3% full reads `0%`, so the
 * one number the gauge exists for says full or empty when it is neither. Inside the range, a value
 * that would print as a bound prints as the closest step short of it instead. Only formats with a
 * fixed number of decimals have such a step; significant digits and compact notation are left as
 * they are.
 */
export function readingText(
	formatter: Intl.NumberFormat,
	value: number,
	min: number,
	max: number
): string {
	const text = formatter.format(value);
	if (!(value > min && value < max)) return text;

	const options = formatter.resolvedOptions();
	const digits = options.maximumFractionDigits;
	if (
		digits === undefined ||
		options.maximumSignificantDigits !== undefined ||
		options.notation !== 'standard'
	) {
		return text;
	}

	// A percent writes a hundred times the value, so its last digit is a hundredth as large.
	const unit = 10 ** -digits / (options.style === 'percent' ? 100 : 1);
	// A range no wider than one step has nothing between its bounds to write.
	if (max - min < unit * 2) return text;
	// A bound of zero is also printed `-0` by a value just under it.
	const reads = (bound: number) =>
		text === formatter.format(bound) || (bound === 0 && text === formatter.format(-0));
	if (reads(max)) return formatter.format(max - unit);
	if (reads(min)) return formatter.format(min + unit);
	return text;
}
