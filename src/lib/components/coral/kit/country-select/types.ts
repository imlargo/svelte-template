/**
 * @coral/kit/country-select
 * @version 1.0.0
 */

import type { ComboboxProps } from '../combobox/types.js';

/**
 * Everything `kit/combobox` takes - `value`, `onchange`, `clearable`, `name`, `required`, the
 * snippets - with `T` fixed to the country code. `options` is Coral's: it is built from
 * `countries`, and `type` is always single.
 */
type ComboboxForwarded = Omit<ComboboxProps<string>, 'options' | 'type'>;

export type CountrySelectProps = ComboboxForwarded & {
	/** The ISO 3166-1 alpha-2 code of the selected country, upper case. Bindable. */
	value?: string;
	/** Which countries to list, as alpha-2 codes. Every country when left out. Sorted by name either way. */
	countries?: readonly string[];
	/** The locale the names are written and sorted in. */
	locale?: string;
};

/** What a project can state once for every country select - see `lib/defaults`. */
export type CountrySelectDefaults = Partial<
	Pick<CountrySelectProps, 'placeholder' | 'searchPlaceholder' | 'emptyMessage' | 'clearLabel'>
>;

declare global {
	interface CoralDefaults {
		'kit/country-select'?: CountrySelectDefaults;
	}
}
