/**
 * @coral/lib/number-field
 * @version 1.1.0
 */

import { format, parse, stepValue } from './number.js';

/**
 * What a number field needs to know about itself, read through functions so it is always the
 * current value of a prop and never the one it had when the field was built.
 */
export type NumberFieldConfig = {
	value: () => number | undefined;
	/** Writes the bindable. Reporting the change is `onchange`'s job, not this one's. */
	set: (next: number | undefined) => void;
	min: () => number | undefined;
	max: () => number | undefined;
	/** How much one step moves the value. */
	step: () => number;
	/** How much a coarse step moves it - Shift held, or the paging keys. */
	largeStep: () => number;
	/** The precision every step and every typed value is rounded to. */
	decimals: () => number;
	/** The locale the value is written and read in. */
	locale: () => string | undefined;
	/** Whether the reader may change the value at all - not disabled, not read-only. */
	editable: () => boolean;
	onchange: () => ((value: number | undefined) => void) | undefined;
};

/** The two number fields draw their own steppers, so the field itself is a plain, centred box. */
export const numberFieldClass = 'w-16 text-center';

/** The behaviour `kit/number-input` and `kit/scrub-input` share; what differs is the controls around it. */
export function numberField(config: NumberFieldConfig) {
	/** The value as the field shows it. Empty for no value. */
	function text(value = config.value()): string {
		return value === undefined ? '' : format(value, config.decimals(), config.locale());
	}

	/** How much one step is worth right now. Shift is the coarse modifier everywhere a number moves. */
	function amount(coarse: boolean): number {
		return coarse ? config.largeStep() : config.step();
	}

	/** The one door: nothing is written, and nothing reported, unless the value actually moved. */
	function commit(next: number | undefined) {
		if (next === config.value()) return;
		config.set(next);
		config.onchange()?.(next);
	}

	function nudge(delta: number) {
		if (!config.editable()) return;

		commit(
			stepValue({
				value: config.value(),
				delta,
				min: config.min(),
				max: config.max(),
				decimals: config.decimals()
			})
		);
	}

	/**
	 * Reads the field on commit - blur, Enter - not per keystroke. Clamping per keystroke fights the
	 * typist: with a max of 100, the `1` and the `15` of `150` are both fine, and only the finished
	 * number is wrong. Skipping the commit-time clamp is the other half of the bug: typed entry then
	 * lands on values the steppers themselves refuse to reach.
	 */
	function change(event: Event & { currentTarget: HTMLInputElement }) {
		const field = event.currentTarget;
		const next = parse(field.value, {
			min: config.min(),
			max: config.max(),
			decimals: config.decimals(),
			locale: config.locale()
		});

		commit(next);

		// The element keeps whatever was typed. When that text clamped to a number the value already
		// held, nothing re-renders and the field is left showing `150` over a value of `100`.
		field.value = text(next);
	}

	/**
	 * Up and Down step, the way a spinbutton does, and Shift makes them coarse. Left and Right are
	 * left alone: in a text field they move the caret, and taking that away makes the number
	 * impossible to edit. Handled here rather than by the browser so that the coarse modifier and
	 * the bounds behave identically everywhere - engines disagree on all of it.
	 */
	function keydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if (!config.editable() || event.defaultPrevented || event.isComposing) return;

		const field = event.currentTarget;
		const min = config.min();
		const max = config.max();

		/** Each key returns whether it acted; one that did not is left to the caret or a dialog above. */
		const keys: Record<string, () => boolean> = {
			ArrowUp: () => (nudge(amount(event.shiftKey)), true),
			ArrowDown: () => (nudge(-amount(event.shiftKey)), true),
			PageUp: () => (nudge(config.largeStep()), true),
			PageDown: () => (nudge(-config.largeStep()), true),
			Home: () => min !== undefined && (commit(min), true),
			End: () => max !== undefined && (commit(max), true),
			// Puts back what the field held before the edit that is still being typed.
			Escape: () => {
				const held = text();
				if (field.value === held) return false;
				field.value = held;
				// The first Escape is the field's, the second is the dialog's - the rule search-input
				// and inline-edit follow.
				event.stopPropagation();
				return true;
			}
		};

		if (keys[event.key]?.()) event.preventDefault();
	}

	return { text, amount, commit, nudge, change, keydown };
}
