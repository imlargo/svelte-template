/**
 * @coral/kit/phone-input
 * @version 1.0.0
 */

import type { ComponentProps } from 'svelte';
import type { CountryCode } from 'libphonenumber-js';
import type { InputGroupInput } from '#lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `id`, `placeholder`, `required`, `readonly`, `aria-*` -
 * stays available on the number field. `value`, `type` and `onchange` are Coral's: the value is the
 * number in E.164 rather than the text on screen. `name` and `form` are re-declared, because what
 * submits is that E.164 value, not the formatted text.
 */
type InputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	'value' | 'type' | 'files' | 'onchange' | 'name' | 'form' | 'ref'
>;

export type PhoneInputProps = InputProps & {
	/** The number field. Bindable. */
	ref?: HTMLInputElement | null;
	/**
	 * The number in E.164 (`+14155550123`), complete or not. Bindable. `undefined` while the field
	 * holds no digits. Check it with `isValidPhoneNumber` from `libphonenumber-js` before saving.
	 */
	value?: string;
	/**
	 * The country the number is typed for, as an ISO 3166-1 alpha-2 code. Bindable. Follows the
	 * number when one starting with `+` is typed or pasted. Left out, the field is international and
	 * writes the `+` itself.
	 */
	country?: CountryCode;
	/** Which countries the picker lists. Every country with a calling code when left out. */
	countries?: readonly CountryCode[];
	/** The locale the country names are written and sorted in. */
	locale?: string;
	/**
	 * Called when the reader changes the number, by typing, pasting or picking a country - never on
	 * mount, and never when `value` is assigned from code.
	 */
	onchange?: (value: string | undefined) => void;
	/** Submits with a surrounding form, as one field holding the E.164 value. */
	name?: string;
	/** `id` of the form to submit with, for a field outside it. Ignored without `name`. */
	form?: string;
	/** Accessible name of the country button while no country is picked. */
	countryLabel?: string;
	/**
	 * The message the form shows for a number too short or too long for its country. A complete
	 * number, or an empty field, is never blocked; `required` decides about the empty one.
	 */
	invalidMessage?: string;
	/** Shown in the country search box. `kit/country-select`'s default when left out. */
	searchPlaceholder?: string;
	/** Shown when the country search matches nothing. `kit/country-select`'s default when left out. */
	emptyMessage?: string;
	/** Merged onto the number field. */
	class?: string;
	/** Merged onto the input group - the bordered box around the country button and the field. */
	groupClass?: string;
};

/** What a project can state once for every phone input - see `lib/defaults`. */
export type PhoneInputDefaults = Partial<
	Pick<PhoneInputProps, 'countryLabel' | 'invalidMessage' | 'searchPlaceholder' | 'emptyMessage'>
>;

declare global {
	interface CoralDefaults {
		'kit/phone-input'?: PhoneInputDefaults;
	}
}
