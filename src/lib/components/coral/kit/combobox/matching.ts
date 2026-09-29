/**
 * @coral/kit/combobox
 * @version 1.0.0
 */

import { fold } from '../../lib/fold.js';
import type { Option } from '../../lib/options.js';

/** The strings an option can be found by: what is shown, plus anything it was tagged with. */
export function terms<T>(option: Option<T>): string[] {
	return [option.label, option.description, ...(option.keywords ?? [])].filter(
		(term): term is string => typeof term === 'string' && term.length > 0
	);
}

/**
 * The default matcher: does this option answer this search? Folded on both sides, so `acai` finds
 * `Açaí`. An empty search matches everything, which is what shows the list in full before anyone
 * has typed.
 */
export function matches<T>(option: Option<T>, search: string): boolean {
	const needle = fold(search.trim());
	if (needle === '') return true;
	return terms(option).some((term) => fold(term).includes(needle));
}

/**
 * Whether `value` is among `values`. Comparison is `===` throughout the component, so objects match
 * by reference - the predictable rule. A deep compare would silently fuse two equal-looking
 * records, and there is no correct default for what "equal" means to a caller's domain type.
 */
export function includesValue<T>(values: T[], value: T): boolean {
	return values.some((candidate) => candidate === value);
}
