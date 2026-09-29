<script lang="ts">
	/**
	 * @coral/kit/stepper
	 * @version 1.0.0
	 */
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { getStepper } from './context.js';
	import type { StepperNextProps } from './types.js';

	let {
		nextLabel = 'Next',
		finishLabel = 'Finish',
		disabled = false,
		ref = $bindable(null),
		children,
		...restProps
	}: StepperNextProps = $props();

	const stepper = getStepper();

	function handleClick(event: MouseEvent) {
		// `aria-disabled` rather than `disabled` while pending keeps focus on the button - see
		// kit/action-button - so the click that arrives in the meantime is dropped here.
		if (stepper.pending) {
			event.preventDefault();
			return;
		}
		stepper.next();
	}
</script>

<Button
	bind:ref
	type="button"
	{disabled}
	aria-disabled={stepper.pending ? 'true' : undefined}
	aria-busy={stepper.pending ? 'true' : undefined}
	onclick={handleClick}
	{...restProps}
>
	{#if stepper.pending}
		<Spinner data-icon="inline-start" aria-hidden="true" />
	{/if}
	{#if children}
		{@render children({ isLast: stepper.isLast, pending: stepper.pending })}
	{:else}
		{stepper.isLast ? finishLabel : nextLabel}
	{/if}
</Button>
