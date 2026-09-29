/**
 * @coral/kit/combobox
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Popover } from '$lib/components/ui/popover/index.js';
import type { Option, Options } from '../../lib/options.js';
import type { TriggerAttributes } from '../../lib/trigger.js';

/** What the `trigger` snippet receives. Spread `props` onto whatever element you render. */
export type TriggerContext<T> = {
	props: Record<string, unknown>;
	/** Every selected option. Empty when nothing is selected; at most one unless `type="multiple"`. */
	selected: Option<T>[];
	open: boolean;
	disabled: boolean;
	/** Deselects everything. */
	clear: () => void;
};

/** What the `option` snippet receives. */
export type OptionContext<T> = {
	option: Option<T>;
	selected: boolean;
};

/** What the `footer` snippet receives. Rendered below the list, inside the popover. */
export type FooterContext<T> = {
	selected: Option<T>[];
	/** Every option currently passing the filter. */
	visible: Option<T>[];
	clear: () => void;
	/**
	 * Adds every option in `visible` to the selection, keeping what was already picked. Only
	 * meaningful when `type="multiple"`.
	 */
	selectAll: () => void;
	close: () => void;
};

type RootProps = Omit<ComponentProps<typeof Popover>, 'children'>;

type BaseProps<T> = RootProps &
	TriggerAttributes & {
		/** The list to choose from, flat or grouped. */
		options: Options<T>;
		/** Shown on the trigger while nothing is selected. */
		placeholder?: string;
		/** Shown in the search box. */
		searchPlaceholder?: string;
		/** Shown when the search matches nothing. */
		emptyMessage?: string;
		/** Blocks the trigger. */
		disabled?: boolean;
		/** Adds a clear control to the trigger, and makes re-picking the selected option unset it. */
		clearable?: boolean;
		/** Accessible label for the clear control. */
		clearLabel?: string;
		/** Renders a loading row in place of the list. Pair with `onsearch` for server-side search. */
		loading?: boolean;
		/**
		 * Submits with a surrounding form, as one field per selected value - so `type="multiple"`
		 * posts the shape a server already reads as a list.
		 */
		name?: string;
		/** `id` of the form to submit with, for a combobox outside it. Ignored without `name`. */
		form?: string;
		/** Blocks submission while nothing is selected. Needs `name`. */
		required?: boolean;
		/**
		 * Turns a value into the string a form submits. Defaults to `String` - right for ids, numbers
		 * and enum members, wrong for objects. Required when `name` is set and `T` is not a primitive.
		 */
		serialize?: (value: T) => string;
		/** The search term. Bindable, so the caller can read or reset it. */
		search?: string;
		/**
		 * Called as the user types. This is the hook for server-side search: fetch, then hand the
		 * results back through `options`. Debounced by `searchDebounce`.
		 */
		onsearch?: (search: string) => void;
		/** Milliseconds to wait before `onsearch` fires. `0` calls it on every keystroke. */
		searchDebounce?: number;
		/**
		 * Whether to filter on the client. Set `false` when the server already returned a filtered
		 * list, so the results are not filtered twice.
		 */
		shouldFilter?: boolean;
		/**
		 * Replaces the built-in matching. Return `true` to keep the option. The default folds accents
		 * and case, and matches against the label, the description and any keywords.
		 */
		filter?: (option: Option<T>, search: string) => boolean;
		/** How many badges the trigger shows before collapsing into a counter. `type="multiple"` only. */
		maxDisplay?: number;
		/** Merged onto the trigger button. */
		class?: string;
		/** Merged onto the popover content. */
		contentClass?: string;
		/** Merged onto the scrolling list. Use it to change the max height. */
		listClass?: string;
		/** Replaces the whole trigger. */
		trigger?: Snippet<[TriggerContext<T>]>;
		/** Replaces the body of each option row. The check indicator stays. */
		option?: Snippet<[OptionContext<T>]>;
		/** Replaces the empty state. */
		empty?: Snippet;
		/** Replaces the loading row. */
		indicator?: Snippet;
		/** Rendered below the list - bulk actions, a count, a "create new" affordance. */
		footer?: Snippet<[FooterContext<T>]>;
	};

/** Which selection mode a combobox is in. */
export type ComboboxType = 'single' | 'multiple';

/** The shape of `value` for a given mode. */
export type ComboboxValue<T, Type extends ComboboxType> = Type extends 'multiple'
	? T[]
	: T | undefined;

/**
 * The shape of what `onchange` receives: the same shape as `value`, hydrated into options.
 *
 * Single hands over the option that was picked, or `undefined` when the selection was cleared.
 * Multiple hands over every selected option, in list order - which is also what makes a bulk
 * change legible: `clear` reports `[]` and `selectAll` reports the whole resulting selection,
 * where a single changed row could only have reported nothing.
 */
export type ComboboxSelection<T, Type extends ComboboxType> = Type extends 'multiple'
	? Option<T>[]
	: Option<T> | undefined;

/**
 * `Type` decides the shape of `value` and of `onchange`'s first argument, the same way `type`
 * does on shadcn's select. It is inferred from the `type` prop and defaults to `single`, so the
 * common case stays a plain `<Combobox options value />`.
 *
 * A conditional type rather than a union of two prop shapes: a union cannot be discriminated when
 * the discriminant is left out, and callers who omitted `type` lost the inferred parameters on
 * `onchange` entirely.
 */
export type ComboboxProps<T, Type extends ComboboxType = 'single'> = BaseProps<T> & {
	type?: Type;
	/** The selection. Bindable. Matched with `===`. An array when `type="multiple"`. */
	value?: ComboboxValue<T, Type>;
	/**
	 * Called when the user picks, toggles or clears - never on mount, and never when `value` is
	 * assigned from code.
	 *
	 * It hands over the selection itself, not the raw values: `value` is already available through
	 * binding, and `option.value` recovers it anyway, while the reverse costs the caller a lookup
	 * against the list it just handed in.
	 */
	onchange?: (selection: ComboboxSelection<T, Type>) => void;
};
