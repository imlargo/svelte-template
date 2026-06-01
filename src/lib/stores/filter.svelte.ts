export function createFilterStore<T extends Record<string, unknown>>(initial: T) {
	let filters = $state<T>({ ...initial });

	const hasActive = $derived(
		Object.values(filters as Record<string, unknown>).some(
			(v) => v !== '' && v !== null && v !== undefined
		)
	);

	function set<K extends keyof T>(key: K, value: T[K]) {
		filters[key] = value;
	}

	function reset() {
		filters = { ...initial };
	}

	return {
		get filters() {
			return filters;
		},
		get hasActive() {
			return hasActive;
		},
		get search() {
			return ((filters as Record<string, unknown>).search as string) ?? '';
		},
		set search(v: string) {
			(filters as Record<string, unknown>).search = v;
		},
		get status() {
			return ((filters as Record<string, unknown>).status as string) ?? '';
		},
		set status(v: string) {
			(filters as Record<string, unknown>).status = v;
		},
		set,
		reset
	};
}
