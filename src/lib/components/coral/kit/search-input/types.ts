/**
 * @coral/kit/search-input
 * @version 1.0.0
 */

import type { ComponentProps } from 'svelte';
import type { InputGroupInput } from '#lib/components/ui/input-group/index.js';

/**
 * Everything the shadcn input accepts - `name`, `placeholder`, `id`, `aria-*`, `autofocus` - stays
 * available. `value` is re-declared as a string, and `type` is always `search`; `files` goes with it.
 */
type InputProps = Omit<ComponentProps<typeof InputGroupInput>, 'value' | 'type' | 'files' | 'ref'>;

export type SearchInputProps = InputProps & {
	/** The field. Bindable. */
	ref?: HTMLInputElement | null;
	/** What is in the field, untrimmed and undebounced. Bindable. */
	value?: string;
	/**
	 * Called with the term to search for: trimmed, debounced, empty below `minLength`, and only when
	 * it differs from the last one reported. Enter and clearing report straight away.
	 */
	onsearch?: (term: string) => void;
	/** Milliseconds of quiet typing before `onsearch` runs. `0` reports on every change. */
	searchDebounce?: number;
	/** Shortest term worth searching for. Anything shorter is reported as an empty search. */
	minLength?: number;
	/** Shows a spinner in place of the search icon - a request for the current term is in flight. */
	loading?: boolean;
	/** Accessible label for the clear control. */
	clearLabel?: string;
	/** Merged onto the input. */
	class?: string;
	/** Merged onto the bordered group around everything. */
	groupClass?: string;
};
