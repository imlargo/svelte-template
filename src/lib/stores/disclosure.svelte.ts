// Toggle state for modals, drawers, dropdowns, etc.
// Usage: const modal = new Disclosure()  or  new Disclosure(true) to start open
export class Disclosure {
	open = $state(false)

	constructor(initial = false) {
		this.open = initial
	}

	show() { this.open = true }
	hide() { this.open = false }
	toggle() { this.open = !this.open }
}
