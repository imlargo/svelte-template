/**
 * @coral/kit/file-input
 * @version 1.1.1
 */

import type { Snippet } from 'svelte';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { FileRejection } from './collect.js';

/**
 * Everything a native file input accepts - `id`, `required`, `capture`, `aria-*`, `tabindex` - goes
 * to the real input underneath, so a surrounding `Field` can label it the usual way.
 *
 * The ones Coral owns are left out: `value` and `files` because the selection is `File[]` rather
 * than a `FileList`, `type` because it is always `file`, and `size` because on an input that means
 * a character width and here it would read as a byte count.
 */
type InputProps = Omit<
	HTMLInputAttributes,
	'value' | 'files' | 'type' | 'size' | 'children' | 'class' | 'onchange'
>;

export type ZoneContext = {
	/** A drag is currently over the zone. */
	dragging: boolean;
	disabled: boolean;
	/** `PDF, JPG · 5 MB`, or an empty string when nothing was constrained. */
	hint: string;
};

export type FileContext = {
	file: File;
	index: number;
	/** Drops this file from the selection. */
	remove: () => void;
};

export type FileInputProps = InputProps & {
	/** The selected files. Bindable. */
	value?: File[];
	/**
	 * Called when the selection changes - a pick, a drop, a removal. Never on mount, and never when
	 * `value` is assigned from code. Receives the whole selection, not the delta.
	 */
	onchange?: (files: File[]) => void;
	/**
	 * Called with everything that was turned away, and why.
	 *
	 * Coral renders no error of its own: the message is copy, copy is the project's, and where it
	 * belongs - inline under the field, or a toast - is the project's too. Wire this up whenever
	 * you set `accept`, `maxSize` or `maxFiles`, or files will be dropped silently.
	 */
	onreject?: (rejections: FileRejection[]) => void;
	/** Which files the picker offers and a drop accepts, e.g. `image/*,.pdf`. */
	accept?: string;
	/** Allows more than one file. */
	multiple?: boolean;
	/** How many files may be held. Only read when `multiple`; omitted means unbounded. */
	maxFiles?: number;
	/** Largest allowed size per file, in bytes. Omitted means unbounded. */
	maxSize?: number;
	disabled?: boolean;
	/** The line inside the zone. */
	label?: string;
	/**
	 * The line under it. Defaults to a summary built from `accept` and `maxSize` - `PDF, JPG · 5 MB`.
	 * Pass an empty string to render none.
	 */
	hint?: string;
	/** Accessible label for a row's remove button. Takes the file, because "Remove" alone names none. */
	removeLabel?: (file: File) => string;
	/** Merged onto the drop zone. Use it to change the height or padding. */
	class?: string;
	/** Merged onto the list of selected files. */
	listClass?: string;
	/** Replaces the contents of the drop zone. */
	zone?: Snippet<[ZoneContext]>;
	/**
	 * Replaces each row of the selected-file list.
	 *
	 * This is the seam an uploader is built on: Coral holds the files and knows nothing about where
	 * they go, so per-file progress, retries and remote state are rendered here by the project that
	 * owns the request.
	 */
	file?: Snippet<[FileContext]>;
};

export type { FileRejection, RejectionReason } from './collect.js';
