/**
 * @coral/kit/textarea
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Textarea } from '#lib/components/ui/textarea/index.js';

/**
 * Everything the shadcn textarea accepts - `name`, `id`, `placeholder`, `required`, `disabled`,
 * `aria-*` - stays available. `rows` is re-declared as the minimum rather than the fixed height,
 * and `onsubmit` is Coral's: it reports the text, not a form event, and leaving the DOM one in
 * place intersects the two into a handler no caller can satisfy.
 */
type BaseProps = Omit<ComponentProps<typeof Textarea>, 'rows' | 'onsubmit'>;

/** What the `counter` snippet receives. */
export type CounterContext = {
	/** Characters used, counted the way `maxlength` counts them. */
	count: number;
	/** How many are left. `0` once the limit is spent. */
	left: number;
	limit: number;
	/** The limit is close enough to be worth saying - see `warnAt`. */
	warning: boolean;
};

export type TextareaProps = BaseProps & {
	/** The text. Bindable. */
	value?: string;
	/** Shortest the field ever gets, in lines. */
	rows?: number;
	/**
	 * Tallest it grows to, in lines. Past this the field scrolls inside itself rather than pushing
	 * the rest of the page down. Omitted, it grows as far as the text does.
	 */
	maxRows?: number;
	/** Largest number of characters. Enforced by the browser, and read by the counter. */
	maxLength?: number;
	/** Shows how much of `maxLength` is used. Needs a limit to count against. */
	showCount?: boolean;
	/**
	 * How many characters from the limit the counter starts warning, and announces. Its default
	 * leaves the last tenth of the allowance as the warning zone.
	 */
	warnAt?: number;
	/**
	 * What is announced to a screen reader once the counter is in its warning zone, given how many
	 * characters are left. Spoken only then - see `warnAt`.
	 */
	remainingLabel?: (left: number) => string;
	/**
	 * Which keys submit. `mod-enter` is the form convention - Enter still writes a newline; `enter`
	 * is the chat one, where Shift-Enter is the newline. `false` leaves both alone.
	 */
	submitOn?: 'mod-enter' | 'enter' | false;
	/** Runs when those keys are pressed, with the text as it stands. Never for an empty field. */
	onsubmit?: (value: string) => void;
	/** The element. Bindable. */
	ref?: HTMLTextAreaElement | null;
	/** Merged onto the textarea. */
	class?: string;
	/** Replaces the counter. Rendered under the field, wired as its description. */
	counter?: Snippet<[CounterContext]>;
};

export type { Height, Metrics } from './measure.js';
