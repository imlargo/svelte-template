/**
 * @coral/kit/tags-input
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { BadgeVariant } from '$lib/components/ui/badge/index.js';
import type { InputGroupInput } from '$lib/components/ui/input-group/index.js';
import type { TagRejection } from './tags.js';

/**
 * Everything the shadcn input accepts - `placeholder`, `id`, `aria-*`, `maxlength`, `autocomplete`,
 * `ref` - stays available on the field where the typing happens.
 *
 * `value` and `name` are Coral's: the value is the list of tags rather than the text being typed,
 * and the name goes on the hidden inputs that submit that list, never on the visible field. `type`
 * and `files` go with them - a field that is always text can never carry a `FileList`.
 */
type InputProps = Omit<
	ComponentProps<typeof InputGroupInput>,
	'value' | 'name' | 'type' | 'files' | 'ref'
>;

/** What the `tag` snippet receives. */
export type TagContext = {
	/** The tag itself. */
	value: string;
	/** Its position in the list. */
	index: number;
	/** Takes this tag out. Same path the remove control uses, focus handling included. */
	remove: () => void;
};

export type TagsInputProps = InputProps & {
	/**
	 * The field itself. Bindable. Narrower than what the primitive exposes - `input-group` types its
	 * ref as an `HTMLElement`, and this one is always an input, so `select()` and friends are there.
	 */
	ref?: HTMLInputElement | null;
	/** The tags. Bindable. */
	value?: string[];
	/** The text being typed, before it becomes a tag. Bindable, so the caller can read or reset it. */
	inputValue?: string;
	/**
	 * Called when the list changes - a tag added, removed or cleared. Never on mount, and never
	 * when `value` is assigned from code.
	 */
	onchange?: (tags: string[]) => void;
	/**
	 * Called with everything that was turned away, in one go per batch. This is the hook for saying
	 * why nothing happened - a duplicate, a failed `validate`, a full list.
	 */
	onreject?: (rejected: TagRejection[]) => void;
	/**
	 * What separates one tag from the next, typed or pasted. A newline always separates as well.
	 * Pass `''` to leave newlines as the only separator.
	 */
	delimiter?: string | RegExp;
	/** How many tags may be held. Omitted means unbounded. Extra ones are reported to `onreject`. */
	max?: number;
	/** Whether the same tag may be held twice. */
	allowDuplicates?: boolean;
	/**
	 * Return `false` to turn a value away - a length rule, a shape, a list of allowed terms.
	 * Receives the tags as they stand, so a batch is judged against what the earlier values added.
	 */
	validate?: (value: string, tags: string[]) => boolean;
	/**
	 * Cleans a value before it is judged and stored. Defaults to trimming; lowercasing or stripping
	 * a leading `#` belongs here, so the same rule applies to typing, pasting and blurring alike.
	 */
	sanitize?: (raw: string) => string;
	/** Whether leaving the field turns what is in it into a tag, instead of dropping it. */
	addOnBlur?: boolean;
	/** Adds a control that empties the list. */
	clearable?: boolean;
	/** Accessible label for the clear control. */
	clearLabel?: string;
	/** Accessible label for a tag's remove control. Takes the tag, because "Remove" alone names none. */
	removeLabel?: (value: string) => string;
	/** Requires at least one tag before the surrounding form submits. */
	required?: boolean;
	/** Submits the tags with a surrounding form, as one hidden input per tag. */
	name?: string;
	/** Blocks the field and drops the remove controls. */
	disabled?: boolean;
	/** Shows the tags without offering to change them. */
	readonly?: boolean;
	/** Which badge variant the tags are drawn with. */
	tagVariant?: BadgeVariant;
	/** Merged onto the box around everything. */
	class?: string;
	/** Merged onto the field where the typing happens. */
	inputClass?: string;
	/** Merged onto each tag. */
	tagClass?: string;
	/** Replaces the body of each tag - an icon, an avatar, a count. The remove control stays. */
	tag?: Snippet<[TagContext]>;
};
