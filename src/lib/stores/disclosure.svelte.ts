export function createDisclosure(initial = false) {
	let isOpen = $state(initial);

	return {
		get isOpen() {
			return isOpen;
		},
		open: () => {
			isOpen = true;
		},
		close: () => {
			isOpen = false;
		},
		toggle: () => {
			isOpen = !isOpen;
		}
	};
}
