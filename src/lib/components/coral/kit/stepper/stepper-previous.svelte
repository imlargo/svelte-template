<script lang="ts">
	/**
	 * @coral/kit/stepper
	 * @version 1.1.0
	 */
	import { Button } from '#lib/components/ui/button/index.js';
	import { getStepper } from './context.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import type { StepperPreviousProps } from './types.js';

	const defaults = getCoralDefaults('kit/stepper');

	let {
		label = defaults.previousLabel ?? 'Previous',
		variant = 'outline',
		disabled = false,
		ref = $bindable(null),
		children,
		...restProps
	}: StepperPreviousProps = $props();

	const stepper = getStepper();
</script>

<Button
	bind:ref
	type="button"
	{variant}
	disabled={disabled || stepper.isFirst || stepper.pending}
	onclick={() => stepper.previous()}
	{...restProps}
>
	{#if children}{@render children()}{:else}{label}{/if}
</Button>
