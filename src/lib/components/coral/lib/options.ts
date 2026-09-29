/**
 * @coral/lib/options
 * @version 1.0.0
 */

/**
 * One entry in a selectable list.
 *
 * `value` is generic because what gets selected is rarely a string - it is an id, an enum member,
 * a number - and closing it to `string` moves the conversion into every caller, both ways. Fields
 * a component has no use for are ignored, not rejected: a select never reads `keywords`.
 */
export type Option<T = string> = {
	value: T;
	label: string;
	/** Blocks selection. The option stays visible. */
	disabled?: boolean;
	/** Second line under the label. Searched along with it, where there is a search. */
	description?: string;
	/** Extra terms that should match this option without being shown - synonyms, codes, an old name. */
	keywords?: string[];
};

/** A labelled run of options, rendered under a heading. */
export type OptionGroup<T = string> = {
	label?: string;
	options: Option<T>[];
};

/**
 * Either a flat list or a grouped one. Do not mix the two in a single array - the first entry
 * decides how the whole array is read.
 */
export type Options<T> = Option<T>[] | OptionGroup<T>[];

/**
 * Whether an entry is a group rather than an option. Told apart by carrying `options`, so an option
 * may not have a property by that name. A `kind` discriminator would have to be written on every
 * option by hand - a tax on the common case to tidy the rare one.
 */
export function isGroup<T>(entry: Option<T> | OptionGroup<T>): entry is OptionGroup<T> {
	return entry !== null && typeof entry === 'object' && 'options' in entry;
}

/**
 * Reads either shape as groups, so the rest of a component handles one. A flat list becomes a
 * single unlabelled group; the first entry decides how the whole array is read, since a mixed
 * array is a caller mistake and guessing per entry would hide it.
 */
export function toGroups<T>(options: Options<T>): OptionGroup<T>[] {
	if (options.length === 0) return [];
	return isGroup(options[0])
		? (options as OptionGroup<T>[])
		: [{ options: options as Option<T>[] }];
}

/** Every option, in order, with the grouping discarded. */
export function flatten<T>(options: Options<T>): Option<T>[] {
	return toGroups(options).flatMap((group) => group.options);
}
