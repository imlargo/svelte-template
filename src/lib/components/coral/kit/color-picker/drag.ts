/**
 * @coral/kit/color-picker
 * @version 1.0.0
 */

/** Holds a fraction to `0..1`. */
export const unit = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Follows a pointer pressed on `surface` until it lets go, reporting where it is as fractions of
 * the surface, `0` to `1` from the top left. Captured, so a drag that leaves the surface keeps
 * moving the thumb along its edge instead of dropping it.
 *
 * Fractions of the drawn rect on both sides of the division, so a picker inside a scaled element
 * still lands under the pointer.
 */
export function drag(
	event: PointerEvent,
	surface: HTMLElement,
	onmove: (x: number, y: number) => void,
	onend: () => void
): void {
	if (event.button !== 0) return;
	// No text selection and no native drag starting under the pointer.
	event.preventDefault();

	const report = (at: PointerEvent) => {
		const box = surface.getBoundingClientRect();
		onmove(unit((at.clientX - box.left) / box.width), unit((at.clientY - box.top) / box.height));
	};

	const end = () => {
		surface.removeEventListener('pointermove', report);
		surface.removeEventListener('pointerup', end);
		surface.removeEventListener('pointercancel', end);
		onend();
	};

	surface.setPointerCapture(event.pointerId);
	surface.addEventListener('pointermove', report);
	surface.addEventListener('pointerup', end);
	surface.addEventListener('pointercancel', end);
	report(event);
}

/**
 * How far one key moves a channel, as a fraction of its range: a hundredth, ten with Shift or on
 * the paging keys, and the whole way on `Home` and `End`. `undefined` for a key that moves nothing
 * along this axis.
 */
export function keyStep(
	event: Pick<KeyboardEvent, 'key' | 'shiftKey'>,
	axis: 'x' | 'y'
): { by: number } | { to: number } | undefined {
	const step = event.shiftKey ? 0.1 : 0.01;
	const keys =
		axis === 'x'
			? { ArrowRight: step, ArrowLeft: -step }
			: { ArrowUp: step, ArrowDown: -step, PageUp: 0.1, PageDown: -0.1 };
	const by = keys[event.key as keyof typeof keys];
	if (by !== undefined) return { by };
	if (axis === 'x' && event.key === 'Home') return { to: 0 };
	if (axis === 'x' && event.key === 'End') return { to: 1 };
	return undefined;
}
