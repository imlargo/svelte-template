import { PAGINATION_DEFAULTS } from '$lib/config/domain/pagination';

export function createPaginationStore(initialPageSize = PAGINATION_DEFAULTS.pageSize) {
	let page = $state(1);
	let pageSize = $state(initialPageSize);
	let total = $state(0);

	const totalPages = $derived(Math.ceil(total / pageSize));
	const hasNext = $derived(page < totalPages);
	const hasPrev = $derived(page > 1);
	const offset = $derived((page - 1) * pageSize);

	function next() {
		if (hasNext) page++;
	}
	function prev() {
		if (hasPrev) page--;
	}
	function goTo(p: number) {
		page = Math.max(1, Math.min(p, totalPages));
	}
	function setTotal(t: number) {
		total = t;
	}
	function reset() {
		page = 1;
	}

	return {
		get page() {
			return page;
		},
		get pageSize() {
			return pageSize;
		},
		get total() {
			return total;
		},
		get totalPages() {
			return totalPages;
		},
		get hasNext() {
			return hasNext;
		},
		get hasPrev() {
			return hasPrev;
		},
		get offset() {
			return offset;
		},
		setTotal,
		next,
		prev,
		goTo,
		reset
	};
}
