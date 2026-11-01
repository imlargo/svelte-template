/**
 * @coral/kit/combobox
 * @version 1.3.0
 */

import { includesValue } from './matching.js';
import type { Option } from '../../lib/options.js';

/**
 * The options one combobox has shown as selected, by value.
 *
 * With server-side search `options` holds only the latest results, and a selected option that
 * drops out of them must not take its label off the trigger with it: the reader searched for
 * something else, or an edit form opened on a value the first page never contained. Every option
 * that passes through `hydrate` as selected is kept, so once listed it stays known.
 */
export class Remembered<T> {
	#known = new Map<T, Option<T>>();

	/**
	 * The options carrying `values`: the ones in `all`, in list order, then any `all` no longer
	 * holds but this instance has shown before, in selection order.
	 */
	/** Keeps an option known before any list has carried it - one the caller just created. */
	remember(option: Option<T>): void {
		this.#known.set(option.value, option);
	}

	hydrate(all: Option<T>[], values: T[]): Option<T>[] {
		const listed = all.filter((option) => includesValue(values, option.value));
		for (const option of listed) this.#known.set(option.value, option);

		const shown = new Set(listed.map((option) => option.value));
		const kept = values.flatMap((entry) => {
			const known = shown.has(entry) ? undefined : this.#known.get(entry);
			return known ? [known] : [];
		});
		return [...listed, ...kept];
	}
}
