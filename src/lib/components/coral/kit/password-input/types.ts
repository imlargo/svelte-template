/**
 * @coral/kit/password-input
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { InputGroupInput } from '$lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `name`, `placeholder`, `required`, `minlength`,
 * `autocomplete`, `aria-*` - stays available. `type` is Coral's, because switching it is the whole
 * component, and `files` goes with it.
 */
type InputProps = Omit<ComponentProps<typeof InputGroupInput>, 'type' | 'files' | 'ref'>;

export type PasswordInputProps = InputProps & {
	/** The field. Bindable. */
	ref?: HTMLInputElement | null;
	/** Whether the password is shown as text. Bindable. */
	visible?: boolean;
	/** Whether Caps Lock was on at the last key press inside the field. Bindable, read-only in spirit. */
	capsLock?: boolean;
	/**
	 * Accessible name of the visibility toggle. One name for both states: the toggle reports
	 * `aria-pressed`, so "Show password, pressed" already means the password is showing.
	 */
	toggleLabel?: string;
	/** Announced, and set as the indicator's name, while Caps Lock is on. */
	capsLockLabel?: string;
	/**
	 * Hides the password again when its form submits. On by default - see the docs for what a
	 * password manager does with a field that is `type="text"` at the moment of submission.
	 */
	hideOnSubmit?: boolean;
	/** Called when the reader shows or hides the password. Never when `visible` is set from code. */
	onvisiblechange?: (visible: boolean) => void;
	/** Merged onto the input. */
	class?: string;
	/** Merged onto the bordered group around everything. */
	groupClass?: string;
	/**
	 * Replaces the Caps Lock indicator. Rendered only while Caps Lock is on; render nothing from it
	 * to opt out of the warning altogether.
	 */
	capsLockIndicator?: Snippet;
};
