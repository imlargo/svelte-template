/**
 * @coral/kit/shortcut
 * @version 1.0.0
 */

import { detectPlatform, isPlain, isTyping, matches, parse } from './keys.js';
import type { Platform } from './keys.js';

export type ListenOptions = {
	/** Where to listen. Defaults to `window`. Pass an element to scope a shortcut to a region. */
	target?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
	/** Which conventions `mod` resolves by. Detected when omitted. */
	platform?: Platform;
	/**
	 * Whether the shortcut fires while focus is in a text field. Defaults to yes for combos with
	 * Control, Command or Alt, and no for plain keys, which are also characters someone is typing.
	 */
	allowInFields?: boolean;
	/** Whether holding the keys down fires repeatedly. Off: one press, one call. */
	allowRepeat?: boolean;
	/** Stops the browser's own action for the combo - `mod+k` focusing the address bar, say. */
	preventDefault?: boolean;
};

/**
 * Calls `handler` whenever `shortcut` is pressed, and returns the function that stops listening -
 * the shape an `$effect` cleanup takes, so a component binds a shortcut in one line:
 *
 * ```ts
 * $effect(() => listen('mod+k', () => (open = true)));
 * ```
 *
 * Exported apart from the component so a shortcut can be bound where nothing is drawn for it.
 */
export function listen(
	shortcut: string,
	handler: (event: KeyboardEvent) => void,
	{
		target,
		platform,
		allowInFields,
		allowRepeat = false,
		preventDefault = true
	}: ListenOptions = {}
): () => void {
	const on = target ?? (typeof window === 'undefined' ? undefined : window);
	if (!on) return () => {};

	const combo = parse(shortcut, platform ?? detectPlatform());
	const inFields = allowInFields ?? !isPlain(combo);

	const onKeydown = (event: Event) => {
		const press = event as KeyboardEvent;
		// Already claimed by something closer to the focus - a menu's own arrow keys, an open dialog.
		if (press.defaultPrevented || press.isComposing) return;
		if (press.repeat && !allowRepeat) return;
		if (!matches(press, combo)) return;
		if (!inFields && isTyping(press)) return;

		if (preventDefault) press.preventDefault();
		handler(press);
	};

	on.addEventListener('keydown', onKeydown);
	return () => on.removeEventListener('keydown', onKeydown);
}
