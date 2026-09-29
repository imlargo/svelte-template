/**
 * @coral/kit/combobox
 * @version 1.0.0
 */

import type { Option } from '../../lib/options.js';

/**
 * The selection after a bulk "select all", given what the filter is showing.
 *
 * Additive, not a replacement - the two differ only under a search term, which for a combobox is
 * the ordinary case. Replacing would drop what was picked before the term was typed, invisibly:
 * the options losing their tick are the ones the filter is hiding. A disabled option is skipped
 * unless already selected, since a bulk action is no place to quietly deselect something.
 *
 * Ordered by `all`, so a bulk change reads back like every other selection.
 */
export function selectAllVisible<T>(all: Option<T>[], visible: Option<T>[], current: T[]): T[] {
	// Sets, not a scan per option: unfiltered, both lists are the whole list, and nesting the scans
	// would make selecting all of a long one quadratic. `visible` is a subset of `all`, never a
	// rebuild, so identity holds; `Set` reproduces `===` for anything an option can sensibly carry.
	const showing = new Set(visible);
	const held = new Set(current);

	return all
		.filter((option) => held.has(option.value) || (showing.has(option) && !option.disabled))
		.map((option) => option.value);
}
