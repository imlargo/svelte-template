// Generic pagination state.
// Usage: const pagination = new PaginationStore()
export class PaginationStore {
	page = $state(1)
	pageSize = $state(20)
	total = $state(0)

	readonly totalPages = $derived(Math.ceil(this.total / this.pageSize))
	readonly hasNext = $derived(this.page < this.totalPages)
	readonly hasPrev = $derived(this.page > 1)
	readonly offset = $derived((this.page - 1) * this.pageSize)

	next() { if (this.hasNext) this.page++ }
	prev() { if (this.hasPrev) this.page-- }
	goTo(p: number) { this.page = Math.max(1, Math.min(p, this.totalPages)) }
	reset() { this.page = 1 }
}
