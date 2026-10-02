/**
 * @coral/kit/select
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Select, SelectTrigger } from '#lib/components/ui/select/index.js';
import type { Option, Options } from '../../lib/options.js';
import type { TriggerAttributes } from '../../lib/trigger.js';

/**
 * What the shadcn root accepts, minus everything Coral takes over.
 *
 * `type` is always `single` - a multiple select is a combobox in practice, see the note on the
 * component. `value` and `onValueChange` speak bits-ui's string keys rather than `T`. `items` is
 * derived from `options`, and `name` is re-declared because bits-ui's own hidden input would
 * submit the internal key instead of the value.
 *
 * `required` goes with `name`: the primitive only renders the field it would validate when it owns
 * the name, so forwarding it would leave a prop that type-checks and does nothing. Coral honours it
 * on its own field instead, and re-declares it below.
 */
type RootProps = Omit<
	ComponentProps<typeof Select>,
	'type' | 'value' | 'onValueChange' | 'children' | 'items' | 'name' | 'allowDeselect' | 'required'
>;

/** What the `trigger` snippet receives. Replaces the label inside the trigger, not the button. */
export type TriggerContext<T> = {
	/** The selected option, or `undefined` while nothing is selected. */
	selected: Option<T> | undefined;
	placeholder: string;
	disabled: boolean;
};

/** What the `option` snippet receives. */
export type OptionContext<T> = {
	option: Option<T>;
	selected: boolean;
};

export type SelectProps<T> = RootProps &
	TriggerAttributes & {
		/** The list to choose from, flat or grouped. */
		options: Options<T>;
		/** The selection. Bindable. Matched with `===`. */
		value?: T;
		/**
		 * Called when the user picks or clears - never on mount, and never when `value` is assigned
		 * from code. `undefined` means the selection was cleared.
		 *
		 * It hands over the option, not the value: `value` is already available through binding, and
		 * `option.value` recovers it anyway, while the reverse costs the caller a lookup against the
		 * list it just handed in.
		 */
		onchange?: (option: Option<T> | undefined) => void;
		/** Shown on the trigger while nothing is selected. */
		placeholder?: string;
		/** Blocks the trigger. */
		disabled?: boolean;
		/** Adds a clear control to the trigger, and makes re-picking the selected option unset it. */
		clearable?: boolean;
		/** Accessible label for the clear control. */
		clearLabel?: string;
		/** Submits with a surrounding form, as a single field carrying the serialized value. */
		name?: string;
		/** `id` of the form to submit with, for a select outside it. Ignored without `name`. */
		form?: string;
		/** Blocks submission while nothing is selected. Needs `name`. */
		required?: boolean;
		/**
		 * Turns a value into the string a form submits. Defaults to `String` - right for ids, numbers
		 * and enum members, wrong for objects. Required when `name` is set and `T` is not a primitive.
		 */
		serialize?: (value: T) => string;
		/** Trigger height, from the shadcn primitive. */
		size?: ComponentProps<typeof SelectTrigger>['size'];
		/** Merged onto the trigger. */
		class?: string;
		/** Merged onto the dropdown content. */
		contentClass?: string;
		/** Replaces the label inside the trigger. The chevron is the primitive's and stays. */
		trigger?: Snippet<[TriggerContext<T>]>;
		/** Replaces the body of each option row. The check indicator stays. */
		option?: Snippet<[OptionContext<T>]>;
	};
