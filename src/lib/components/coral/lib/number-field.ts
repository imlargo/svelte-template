/**
 * @coral/lib/number-field
 * @version 1.0.0
 */

import { parse, stepValue } from './number.js';

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
	/** The precision every step and every typed value is rounded to. */
	decimals: () => number;
	/** Whether the reader may change the value at all - not disabled, not read-only. */
	editable: () => boolean;
	onchange: () => ((value: number | undefined) => void) | undefined;
};

/**
 * Removes the browser's own spinner arrows, which two number fields drawing their own steppers
 * (buttons on one, a drag handle on the other) would otherwise show a second set of.
 */
export const numberFieldClass =
	'w-16 [appearance:textfield] text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

/** The behaviour `kit/number-input` and `kit/scrub-input` share; what differs is the controls around it. */
export function numberField(config: NumberFieldConfig) {
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
	 * Reads the field on commit - blur, Enter, a native arrow step - not per keystroke. Clamping per
	 * keystroke fights the typist: with a max of 100, the `1` and the `15` of `150` are both fine,
	 * and only the finished number is wrong. Skipping the commit-time clamp is the other half of
	 * the bug: typed entry then lands on values the steppers themselves refuse to reach.
	 */
	function change(event: Event & { currentTarget: HTMLInputElement }) {
		const field = event.currentTarget;
		const next = parse(field.value, config.min(), config.max(), config.decimals());

		commit(next);

		// The element keeps whatever was typed. When that text clamped to a number the value already
		// held, nothing re-renders and the field is left showing `150` over a value of `100`.
		field.value = next === undefined ? '' : String(next);
	}

	/**
	 * A focused number input steps on scroll in Chromium, so scrolling the page with the pointer over
	 * one edits it silently. Nothing here needs the wheel, so it never gets it.
	 */
	function wheel(event: WheelEvent & { currentTarget: HTMLInputElement }) {
		if (document.activeElement === event.currentTarget) event.preventDefault();
	}

	return { commit, nudge, change, wheel };
}
