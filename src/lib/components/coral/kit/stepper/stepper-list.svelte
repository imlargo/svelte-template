<script lang="ts">
	/**
	 * @coral/kit/stepper
	 * @version 1.0.0
	 */
	import { cn } from '$lib/utils.js';
	import { getStepper } from './context.js';
	import type { StepperListProps } from './types.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		onkeydown,
		...restProps
	}: StepperListProps = $props();

	const stepper = getStepper();

	/**
	 * Arrow keys between steps, on top of Tab rather than instead of it: every step is a real button
	 * in the tab order, so the arrows are a shortcut and never the only way to reach one. Disabled
	 * steps are skipped, because focus cannot land on them anyway.
	 */
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLOListElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		const buttons = Array.from(
			event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-coral-step]:not(:disabled)')
		);
		const from = buttons.indexOf(document.activeElement as HTMLButtonElement);
		if (from === -1) return;

		const vertical = stepper.orientation === 'vertical';
		const rtl = !vertical && getComputedStyle(event.currentTarget).direction === 'rtl';
		const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
		const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';

		let to: number;
		if (event.key === back) to = Math.max(0, from - 1);
		else if (event.key === forward) to = Math.min(buttons.length - 1, from + 1);
		else if (event.key === 'Home') to = 0;
		else if (event.key === 'End') to = buttons.length - 1;
		else return;

		event.preventDefault();
		buttons[to]?.focus();
	}
</script>

<!-- An ordered list: the order is the point, and a screen reader says "3 of 4" for free. -->
<ol
	bind:this={ref}
	data-orientation={stepper.orientation}
	class={cn(
		'flex gap-2',
		stepper.orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
		className
	)}
	onkeydown={handleKeydown}
	{...restProps}
>
	{@render children?.()}
</ol>
