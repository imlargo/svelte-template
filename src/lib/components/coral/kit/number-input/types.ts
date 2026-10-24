/**
 * @coral/kit/number-input
 * @version 1.1.0
 */

import type { ComponentProps } from 'svelte';
import type { InputGroupInput } from '#lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `placeholder`, `disabled`, `readonly`, `name`, `id`,
 * `aria-*`, `ref` - stays available. `value` and `type` are Coral's: the value is a number rather
 * than a string, and the field is a text field that reads and writes it in `locale`.
 *
 * `files` goes with `type`: the shadcn input discriminates on it, and a field that only ever holds
 * a number can never carry a `FileList`. `onchange` is Coral's as well - it reports the value, not
 * the DOM event - and leaving the input's own one in place intersects the two into a handler no
 * caller can actually satisfy.
 */
type InputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	'value' | 'type' | 'files' | 'onchange'
>;

export type NumberInputProps = InputProps & {
	/** The value. Bindable. `undefined` means the field is empty. */
	value?: number;
	/** Lowest allowed value. Left out means unbounded downwards, negatives included. */
	min?: number;
	/** Highest allowed value. Left out means unbounded upwards. */
	max?: number;
	/** How much one press of a stepper moves the value. Also sets the rounding precision. */
	step?: number;
	/** How much the paging keys move it, and the arrows while Shift is held. Ten times `step`. */
	largeStep?: number;
	/**
	 * Decimals to round to. Derived from `step` when omitted, which is right almost always - set it
	 * when the step and the precision genuinely differ, as with a step of `1` on a currency field.
	 */
	decimals?: number;
	/**
	 * The locale the number is typed and shown in: it decides whether `1,5` is one and a half or
	 * fifteen, and which separator the field writes back.
	 */
	locale?: string;
	/**
	 * Called when the value changes by a stepper or by a committed edit - never on mount, and never
	 * when `value` is assigned from code.
	 */
	onchange?: (value: number | undefined) => void;
	/** Accessible label for the decrement button. */
	decrementLabel?: string;
	/** Accessible label for the increment button. */
	incrementLabel?: string;
	/** Merged onto the input. */
	class?: string;
	/** Merged onto the input group - the bordered box around everything. */
	groupClass?: string;
};

/** What a project can state once for every number input - see `lib/defaults`. */
export type NumberInputDefaults = Partial<
	Pick<NumberInputProps, 'decrementLabel' | 'incrementLabel'>
>;

declare global {
	interface CoralDefaults {
		'kit/number-input'?: NumberInputDefaults;
	}
}
