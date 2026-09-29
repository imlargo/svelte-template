/**
 * @coral/kit/shortcut
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { KbdGroup } from '$lib/components/ui/kbd/index.js';
import type { KeyToken, Platform } from './keys.js';

/** Everything the shadcn kbd group accepts - `class`, `aria-*`, `ref` - stays available. */
type GroupProps = Omit<ComponentProps<typeof KbdGroup>, 'children'>;

export type ShortcutProps = GroupProps & {
	/**
	 * The combo, as `mod+shift+k`. `mod` is Command on a Mac and Control elsewhere; `cmd`, `opt`,
	 * `esc`, `up` and friends are understood too.
	 */
	keys: string;
	/**
	 * Binds the combo: called when it is pressed anywhere on the page. Leave it out and the component
	 * only draws the keys, for a shortcut something else handles.
	 */
	onpress?: (event: KeyboardEvent) => void;
	/** Stops listening without unmounting - a shortcut that only applies while a panel is open. */
	enabled?: boolean;
	/** Whether it fires while typing in a field. Defaults to yes with a modifier, no without. */
	allowInFields?: boolean;
	/** Stops the browser's own action for the combo. */
	preventDefault?: boolean;
	/** Forces a platform's conventions. Detected in the browser when omitted - see the docs on SSR. */
	platform?: Platform;
	/** Replaces how each key is drawn. */
	key?: Snippet<[KeyToken]>;
};

export type { Combo, KeyToken, Platform } from './keys.js';
export type { ListenOptions } from './listen.js';
