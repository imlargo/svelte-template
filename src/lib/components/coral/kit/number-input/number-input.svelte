<script lang="ts">
	/**
	 * @coral/kit/number-input
	 * @version 1.0.0
	 */
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { cn } from '#lib/utils.js';
	import { decimalsOf } from '../../lib/number.js';
	import { numberField, numberFieldClass } from '../../lib/number-field.js';
	import type { NumberInputProps } from './types.js';

	let {
		value = $bindable(),
		min,
		max,
		step = 1,
		decimals,
		onchange,
		decrementLabel = 'Decrease',
		incrementLabel = 'Increase',
		disabled = false,
		readonly = false,
		class: className,
		groupClass,
		ref = $bindable(null),
		...restProps
	}: NumberInputProps = $props();

	const places = $derived(decimals ?? decimalsOf(step));

	/**
	 * A stepper is only spent once the value is actually against its bound. An empty field leaves
	 * both live, because stepping from empty has somewhere to go in either direction.
	 */
	const atMin = $derived(min !== undefined && value !== undefined && value <= min);
	const atMax = $derived(max !== undefined && value !== undefined && value >= max);

	const field = numberField({
		value: () => value,
		set: (next) => (value = next),
		min: () => min,
		max: () => max,
		decimals: () => places,
		editable: () => !disabled && !readonly,
		onchange: () => onchange
	});
</script>

<InputGroup.Root class={cn('max-w-max', groupClass)}>
	<InputGroup.Addon>
		<InputGroup.Button
			size="icon-sm"
			aria-label={decrementLabel}
			disabled={disabled || readonly || atMin}
			onclick={() => field.nudge(-step)}
		>
			<MinusIcon />
		</InputGroup.Button>
	</InputGroup.Addon>

	<!--
		`type="number"` for the keyboard and the semantics the browser already gives: arrow keys step,
		mobile shows a numeric keypad, and assistive tech reads it as a spinbutton. The native
		spinners are removed because this component draws its own, and two sets of steppers on one
		field is one set too many.
	-->
	<InputGroup.Input
		bind:ref
		type="number"
		inputmode={places > 0 ? 'decimal' : 'numeric'}
		{value}
		{min}
		{max}
		{step}
		{disabled}
		{readonly}
		onchange={field.change}
		onwheel={field.wheel}
		class={cn(numberFieldClass, className)}
		{...restProps}
	/>

	<InputGroup.Addon align="inline-end">
		<InputGroup.Button
			size="icon-sm"
			aria-label={incrementLabel}
			disabled={disabled || readonly || atMax}
			onclick={() => field.nudge(step)}
		>
			<PlusIcon />
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
