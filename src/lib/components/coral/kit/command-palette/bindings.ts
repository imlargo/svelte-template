/**
 * @coral/kit/command-palette
 * @version 1.0.0
 */

import { parse } from '../shortcut/keys.js';
import type { Platform } from '../shortcut/keys.js';

/** The keys the command primitive reads as list navigation while Control is held. */
const VIM_KEYS = ['n', 'j', 'k', 'p', 'h', 'l'];

/**
 * Whether any combo is one the command primitive's vim bindings would eat. Off a Mac `mod+k` is
 * `ctrl+k`, which the primitive reads as "previous item", so the palette would open on it and
 * refuse to close. Empty entries are skipped.
 */
export function swallowsVimKey(
	combos: readonly (string | undefined)[],
	platform: Platform
): boolean {
	return combos
		.filter((combo): combo is string => Boolean(combo))
		.some((combo) => {
			const parsed = parse(combo, platform);
			return parsed.ctrl && !parsed.meta && !parsed.alt && VIM_KEYS.includes(parsed.key);
		});
}
