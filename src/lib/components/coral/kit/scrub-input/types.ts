/**
 * @coral/kit/scrub-input
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { InputGroupInput } from '$lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `name`, `id`, `placeholder`, `aria-*`, `ref` - stays
 * available. `value` and `type` are Coral's: the value is a number rather than a string, and the
 * type is always `number`. `files` goes with them, since a number field can never carry a `FileList`,
 * and so does `onchange`, which reports the value rather than the DOM event.
 */
type InputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	'value' | 'type' | 'files' | 'ref' | 'onchange'
>;

export type ScrubInputProps = InputProps & {
	/**
	 * The field. Bindable. Narrower than what the primitive exposes - `input-group` types its ref as
	 * an `HTMLElement`, and this one is always an input, so `select()` and friends are there.
	 */
	ref?: HTMLInputElement | null;
	/**
	 * The label, and the thing that is dragged. Short enough to sit beside the number - `W`, `Opacity`,
	 * `Timeout`. It names the field, so it is not decoration.
	 */
	label: string;
	/** The value. Bindable. `undefined` means the field is empty. */
	value?: number;
	/** Lowest allowed value. Left out means unbounded downwards, negatives included. */
	min?: number;
	/** Highest allowed value. Left out means unbounded upwards. */
	max?: number;
	/** How much one step moves the value, by drag or by arrow key. Also sets the rounding precision. */
	step?: number;
	/** How much one step moves it while Shift is held. Defaults to ten times `step`. */
	largeStep?: number;
	/**
	 * Decimals to round to. Derived from `step` when omitted, which is right almost always - set it
	 * when the step and the precision genuinely differ.
	 */
	decimals?: number;
	/**
	 * How far the pointer travels per step. Lower is faster: at `1` the value follows the pointer
	 * pixel for pixel, which is what a field measured in pixels usually wants.
	 */
	pixelsPerStep?: number;
	/**
	 * Called when the value changes by a drag, an arrow key or a committed edit - never on mount, and
	 * never when `value` is assigned from code.
	 */
	onchange?: (value: number | undefined) => void;
	/** A drag began. Pair it with `onscrubend` to record one undo entry per drag, not one per step. */
	onscrubstart?: (value: number | undefined) => void;
	/** A drag ended, with the value it settled on. Also fires when a drag is cancelled. */
	onscrubend?: (value: number | undefined) => void;
	/** Unit shown after the number - `px`, `%`, `ms`. */
	suffix?: string;
	disabled?: boolean;
	readonly?: boolean;
	/** Merged onto the input. */
	class?: string;
	/** Merged onto the bordered group around everything. */
	groupClass?: string;
	/** Merged onto the drag handle. */
	handleClass?: string;
	/** Replaces the contents of the handle - an icon, an axis glyph. */
	handle?: Snippet<[{ label: string; scrubbing: boolean }]>;
};

export type { Consumed } from './scrub.js';
