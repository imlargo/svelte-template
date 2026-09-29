<script lang="ts" generics="T">
	/**
	 * @coral/kit/stepper
	 * @version 1.0.0
	 */
	import { cn } from '$lib/utils.js';
	import { getStepper } from './context.js';
	import type { StepperContentProps } from './types.js';

	let {
		step,
		keepMounted = false,
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: StepperContentProps<T> = $props();

	const stepper = getStepper<T>();
	const active = $derived(stepper.value === step);
</script>

<!--
	A labelled region named by its step's button, focusable from code only (`tabindex="-1"`) so the
	stepper can move focus here after Next without adding a tab stop. Its outline is dropped because
	the reader did not put focus there by pressing Tab.
-->
{#if active || keepMounted}
	<div
		bind:this={ref}
		id={stepper.contentId(step)}
		role="region"
		aria-labelledby={stepper.triggerId(step)}
		tabindex="-1"
		hidden={!active}
		data-state={stepper.stateOf(step)}
		class={cn('outline-none', className)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
