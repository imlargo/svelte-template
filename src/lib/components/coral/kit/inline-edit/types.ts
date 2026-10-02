/**
 * @coral/kit/inline-edit
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { InputGroupInput } from '#lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `maxlength`, `placeholder`, `aria-*`, `autocomplete` - goes
 * to the field shown while editing. `value` is re-declared, and the field is always text.
 */
type InputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	'value' | 'type' | 'files' | 'ref' | 'class'
>;

export type InlineEditProps = InputProps & {
	/** The saved text. Bindable. Only changes once a save goes through. */
	value?: string;
	/** Whether the field is showing. Bindable, so a menu item can start an edit. */
	editing?: boolean;
	/**
	 * Runs with the new text when an edit is committed - Enter, or leaving the field. Not called when
	 * the text did not change.
	 *
	 * Return a promise and the field waits on it. Return exactly `false`, or throw, and the edit stays
	 * open with the text as typed, so a rejected rename can be corrected rather than retyped. `value`
	 * is only updated once it went through.
	 */
	onsave?: (value: string) => unknown;
	/**
	 * Receives whatever `onsave` threw. The field stays open with the text as typed either way.
	 * Without it the error propagates as an unhandled rejection.
	 */
	onerror?: (error: unknown) => void;
	/** The edit was abandoned - Escape, or leaving the field with `saveOnBlur` off. */
	oncancel?: () => void;
	/** Return `false` to refuse the text before `onsave` runs. The field is marked invalid. */
	validate?: (value: string) => boolean;
	/** Cleans the text before it is validated and saved. Defaults to trimming. */
	sanitize?: (raw: string) => string;
	/** Refuses empty text. */
	required?: boolean;
	/** Whether leaving the field commits the edit. Off, leaving it cancels. */
	saveOnBlur?: boolean;
	/** Selects the whole text when editing starts, so typing replaces it. */
	selectOnEdit?: boolean;
	/** Shown in place of the value while it is empty, in both modes. */
	placeholder?: string;
	/** Accessible name for the control that starts editing. Takes the value, so it names the thing. */
	editLabel?: (value: string) => string;
	disabled?: boolean;
	/** The field. Bindable. Only exists while editing. */
	ref?: HTMLInputElement | null;
	/** Merged onto the button that shows the value, and onto the field's group while editing. */
	class?: string;
	/** Merged onto the field. */
	inputClass?: string;
	/** Replaces what the button shows. Whatever is rendered here is the thing that gets clicked. */
	display?: Snippet<[{ value: string; placeholder: string }]>;
};
