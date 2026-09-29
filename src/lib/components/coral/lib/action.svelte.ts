/**
 * @coral/lib/action
 * @version 1.0.0
 */

/**
 * Something the reader asked for that may take a while and may fail: a save, a delete, a step that
 * validates on the server.
 *
 * Every component that waits on one needs the same three things - a flag to draw the wait with, a
 * guard so a second click does not send the same write twice, and one agreed way to say "that did
 * not work". The last is the convention confirm-dialog set and the rest follow: **return exactly
 * `false`, or throw**. Anything else, including returning nothing, counts as done, so an existing
 * handler can be passed straight in.
 */
export class Action {
	#running = $state(false);

	/** Whether an action is in flight. Reactive. */
	get running(): boolean {
		return this.#running;
	}

	/**
	 * Runs `action` unless one is already running, and resolves to whether it went through.
	 *
	 * A call made while busy resolves `false` without running anything: from the caller's side it is
	 * indistinguishable from a failure, which is right - nothing it asked for happened. A throw is
	 * not swallowed. It propagates after the flag is reset, so the component can stay put and the
	 * error still reaches whoever is listening for it.
	 */
	async run(action: () => unknown): Promise<boolean> {
		if (this.#running) return false;

		this.#running = true;
		try {
			return (await action()) !== false;
		} finally {
			this.#running = false;
		}
	}
}
