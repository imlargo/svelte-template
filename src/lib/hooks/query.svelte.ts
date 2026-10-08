import { normalizeError, type AppError } from '#lib/core/errors.js';

/**
 * State of data the page loads itself (see `AsyncView`). Only the latest
 * `run()` writes its outcome and the one it supersedes is aborted; a failed
 * run keeps the previous `data`.
 *
 * `run` takes the params the fetch answers, so the query knows which ones
 * produced the rows on screen: a run with different params is `isStale`
 * until it lands, and `AsyncView` shows the loading state instead of rows
 * that answer a question nobody asks any more. A run with the same params
 * is a refresh, and the rows stay.
 */
export class Query<T> {
	// Raw: responses are replaced wholesale, never mutated.
	data = $state.raw<T | null>(null);
	error = $state.raw<AppError | null>(null);
	isLoading = $state(false);

	#renderedKey = $state.raw<string | null>(null);
	#requestedKey = $state.raw<string | null>(null);
	#latest = 0;
	#inFlight: AbortController | null = null;

	/** True before the first load, and while different params are on their way. */
	readonly isStale = $derived(
		this.#renderedKey === null || this.#renderedKey !== this.#requestedKey
	);

	/** Pass `signal` to the service so a superseded request is cancelled, not only ignored. */
	async run(fetcher: (signal: AbortSignal) => Promise<T>, params: unknown = null): Promise<void> {
		this.#inFlight?.abort();
		const controller = new AbortController();
		this.#inFlight = controller;

		const run = ++this.#latest;
		const key = JSON.stringify(params);
		this.#requestedKey = key;
		this.isLoading = true;
		this.error = null;

		try {
			const data = await fetcher(controller.signal);
			if (run === this.#latest) {
				this.data = data;
				this.#renderedKey = key;
			}
		} catch (err) {
			if (run === this.#latest) this.error = normalizeError(err);
		} finally {
			if (run === this.#latest) this.isLoading = false;
		}
	}
}
