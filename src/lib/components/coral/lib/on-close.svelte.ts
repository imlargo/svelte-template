/**
 * @coral/lib/on-close
 * @version 1.0.0
 */

import { untrack } from 'svelte';

/**
 * Runs `callback` when `open` goes from true to false, however it closed. A popover reports only
 * the closes it made itself, not one made by assigning `open` (a footer's `close()`), so anything
 * that must happen on close is watched here. Call it while a component initialises.
 */
export function onClose(open: () => boolean, callback: () => void): void {
	let wasOpen = false;

	$effect(() => {
		if (open()) {
			wasOpen = true;
			return;
		}
		if (!wasOpen) return;

		wasOpen = false;
		untrack(callback);
	});
}
