// Generic filter state — extend or instantiate per feature.
// Usage: const filter = new FilterStore({ search: '', status: '' })
export class FilterStore<T extends Record<string, unknown>> {
	filters = $state<T>({} as T)
	private initial: T

	readonly hasActive = $derived(
		Object.values(this.filters as Record<string, unknown>).some(
			(v) => v !== '' && v !== null && v !== undefined
		)
	)

	constructor(initial: T) {
		this.initial = initial
		this.filters = { ...initial }
	}

	set<K extends keyof T>(key: K, value: T[K]) {
		this.filters[key] = value
	}

	reset() {
		this.filters = { ...this.initial }
	}
}
