/**
 * @coral/lib/debounce
 * @version 1.0.0
 */

export type Debounced<A extends unknown[]> = {
	(...args: A): void;
	/** Drops the pending call, if any. What an unmount or a reset wants. */
	cancel: () => void;
	/** Runs the pending call now instead of later. Does nothing when nothing is pending. */
	flush: () => void;
	/** Whether a call is waiting on the timer. */
	readonly pending: boolean;
};

/**
 * Delays a call until the calls stop coming for `wait` milliseconds, keeping only the last one.
 *
 * `wait` may be a function so a component can read it from a prop on every call - a debounce built
 * once from the value a prop had on mount would ignore every later change to it. A wait of `0` or
 * less calls straight through, synchronously, which is what "no debounce" should mean: a `0`
 * timeout would still defer the call past the current task and reorder it against everything else.
 */
export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	wait: number | (() => number)
): Debounced<A> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let queued: A | undefined;

	function run() {
		const args = queued;
		timer = undefined;
		queued = undefined;
		if (args) fn(...args);
	}

	const debounced = (...args: A) => {
		clearTimeout(timer);
		const delay = typeof wait === 'function' ? wait() : wait;

		if (!(delay > 0)) {
			timer = undefined;
			queued = undefined;
			fn(...args);
			return;
		}

		queued = args;
		timer = setTimeout(run, delay);
	};

	debounced.cancel = () => {
		clearTimeout(timer);
		timer = undefined;
		queued = undefined;
	};

	debounced.flush = () => {
		if (timer === undefined) return;
		clearTimeout(timer);
		run();
	};

	Object.defineProperty(debounced, 'pending', { get: () => timer !== undefined });

	return debounced as Debounced<A>;
}
