<script lang="ts" generics="T">
	/**
	 * @coral/kit/stepper
	 * @version 1.0.0
	 */
	import { cn } from '$lib/utils.js';
	import { focusRing } from '../../lib/focus.js';
	import { getStepper } from './context.js';
	import type { StepperItemProps } from './types.js';

	let {
		step,
		ref = $bindable(null),
		class: className,
		itemClass,
		children,
		...restProps
	}: StepperItemProps<T> = $props();

	const stepper = getStepper<T>();

	const state = $derived(stepper.stateOf(step));
	const disabled = $derived(state !== 'current' && !stepper.canVisit(step));
	const index = $derived(stepper.steps.indexOf(step));
</script>

<li data-state={state} class={cn('flex', itemClass)}>
	<!--
		`aria-current="step"` is the attribute made for exactly this, and what tells a screen reader
		which step is active without inventing wording for it. The button stays enabled on the current
		step so focus can rest there, and pressing it does nothing.
	-->
	<button
		bind:this={ref}
		type="button"
		id={stepper.triggerId(step)}
		data-coral-step={index}
		data-state={state}
		aria-current={state === 'current' ? 'step' : undefined}
		aria-controls={state === 'current' ? stepper.contentId(step) : undefined}
		{disabled}
		class={cn(
			'flex items-center gap-2 text-start disabled:cursor-not-allowed disabled:opacity-50',
			focusRing,
			className
		)}
		onclick={() => stepper.goTo(step)}
		{...restProps}
	>
		{@render children({ state, index, disabled })}
	</button>
</li>
