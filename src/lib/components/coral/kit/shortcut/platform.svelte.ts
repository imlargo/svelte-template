/**
 * @coral/kit/shortcut
 * @version 1.0.0
 */

import { onMount } from 'svelte';
import { detectPlatform } from './keys.js';
import type { Platform } from './keys.js';

/**
 * The platform, safe to draw on the server: `other` until mount, then detected. Drawing `⌘` on the
 * server for a Windows reader is a hydration mismatch. Construct it while a component initialises.
 */
export class PlatformState {
	#current = $state<Platform>('other');

	constructor() {
		onMount(() => {
			this.#current = detectPlatform();
		});
	}

	get current(): Platform {
		return this.#current;
	}
}
