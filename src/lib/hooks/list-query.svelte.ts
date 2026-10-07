import type { AppError } from '#lib/core/errors.js';
import { Query, type AsyncState } from '#lib/hooks/query.svelte.js';

/**
 * A filtered list that knows which filters produced the rows on screen.
 *
 * Two waits deserve opposite treatment. The filters moved: the rows answer a
 * question nobody asks any more, so the table gives way to a skeleton. That is
 * `isStale`. The same list is refreshed after a write: the rows are still the
 * answer, so they stay and only `isLoading` is true.
 */
export class ListQuery<T> implements AsyncState<T> {
	readonly #query = new Query<T>();

	/** The filters that produced the rows currently rendered. */
	#renderedKey = $state.raw<string | null>(null);
	/** The filters of the most recent request, settled or not. */
	#requestedKey = $state.raw<string | null>(null);

	get data(): T | null {
		return this.#query.data;
	}

	get error(): AppError | null {
		return this.#query.error;
	}

	get isLoading(): boolean {
		return this.#query.isLoading;
	}

	/** True before the first load, and whenever a different list is on its way. */
	readonly isStale = $derived(
		this.#renderedKey === null || this.#renderedKey !== this.#requestedKey
	);

	/**
	 * Fetches the list for `params`, a flat object the caller also sends to the
	 * service. A superseded response claims nothing: `Query` drops its data, and
	 * letting it name what is on screen would leave `isStale` stuck.
	 */
	async load(params: object, fetcher: () => Promise<T>): Promise<void> {
		const key = JSON.stringify(params);
		this.#requestedKey = key;

		await this.#query.run(async () => {
			const result = await fetcher();
			if (key === this.#requestedKey) this.#renderedKey = key;
			return result;
		});
	}
}
