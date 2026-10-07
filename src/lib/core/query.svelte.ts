import { normalizeError, type AppError } from './errors';

/**
 * State of data the page loads itself (see `AsyncView`). Only the latest
 * `run()` writes its outcome, and a failed run keeps the previous `data`.
 */
export class Query<T> {
	// Raw: responses are replaced wholesale, never mutated.
	data = $state.raw<T | null>(null);
	error = $state.raw<AppError | null>(null);
	isLoading = $state(false);

	#latest = 0;

	async run(fetcher: () => Promise<T>): Promise<void> {
		const run = ++this.#latest;
		this.isLoading = true;
		this.error = null;

		try {
			const data = await fetcher();
			if (run === this.#latest) this.data = data;
		} catch (err) {
			if (run === this.#latest) this.error = normalizeError(err);
		} finally {
			if (run === this.#latest) this.isLoading = false;
		}
	}
}

export function createQuery<T>(): Query<T> {
	return new Query<T>();
}
