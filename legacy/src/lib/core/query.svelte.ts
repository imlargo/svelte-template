import { normalizeError, type AppError } from './errors';

/**
 * Minimal async-call state for the client: data/error plus read-only flags.
 * Covers what happens after the first render — data from `load` doesn't need this.
 *
 * One `Query` tracks one call at a time. Overlapping `run()` calls are not
 * ordered: the last one to *resolve* wins, which may not be the last one
 * started. If you fire it per keystroke, debounce at the call site.
 */
export class Query<T> {
	// `$state.raw` because API responses are reassigned wholesale, never mutated.
	data = $state.raw<T | null>(null);
	error = $state.raw<AppError | null>(null);
	isLoading = $state(false);

	async run(fetcher: () => Promise<T>): Promise<void> {
		this.isLoading = true;
		this.error = null;

		try {
			this.data = await fetcher();
		} catch (err) {
			this.error = normalizeError(err);
		} finally {
			this.isLoading = false;
		}
	}
}

export function createQuery<T>(): Query<T> {
	return new Query<T>();
}
