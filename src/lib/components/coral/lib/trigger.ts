/**
 * @coral/lib/trigger
 * @version 1.0.0
 */

import type { HTMLButtonAttributes } from 'svelte/elements';

/**
 * `id` and `aria-*` for a control whose trigger is a button. They go to the trigger, not the root,
 * because that is where a `<Label for>` points and where a screen reader looks.
 */
export type TriggerAttributes = Pick<
	HTMLButtonAttributes,
	'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid'
>;
