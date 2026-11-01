<script lang="ts">
	/**
	 * @coral/kit/number-input
	 * @version 1.2.0
	 */
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { cn } from '#lib/utils.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { decimalsOf, fractionDigits } from '../../lib/number.js';
	import { numberField, numberFieldClass } from '../../lib/number-field.js';
	import type { NumberInputProps } from './types.js';

	const defaults = getCoralDefaults('kit/number-input');

	let {
		value = $bindable(),
		min,
		max,
		step = 1,
		largeStep,
		decimals,
		locale = defaults.locale ?? 'en-US',
		format,
		onchange,
		decrementLabel = defaults.decrementLabel ?? 'Decrease',
		incrementLabel = defaults.incrementLabel ?? 'Increase',
		disabled = false,
		readonly = false,
		class: className,
		groupClass,
		ref = $bindable(null),
		onkeydown,
		...restProps
	}: NumberInputProps = $props();

	/** A currency takes its cents even on a step of `1`: a price is not rounded to the dollar. */
	const places = $derived(decimals ?? Math.max(decimalsOf(step), fractionDigits(locale, format)));
	const coarse = $derived(largeStep ?? step * 10);

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
		step: () => step,
		largeStep: () => coarse,
		decimals: () => places,
		locale: () => locale,
		format: () => format,
		editable: () => !disabled && !readonly,
		onchange: () => onchange
	});

	const shown = $derived(field.text(value));

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		field.keydown(event);
	}
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
		A text field, not `type="number"`: a number input parses through the browser, which drops a
		`1,5` typed the way most of the world writes a decimal and shows the value with a point
		whatever the reader's locale. The text field reads and writes the number in `locale`, and
		gives back what the number type had for free - the spinbutton role with its value and bounds,
		a numeric keypad on a phone, and the arrow keys stepping.
	-->
	<InputGroup.Input
		bind:ref
		type="text"
		role="spinbutton"
		inputmode={places > 0 ? 'decimal' : 'numeric'}
		autocomplete="off"
		value={shown}
		aria-valuenow={value}
		aria-valuetext={value === undefined ? undefined : shown}
		aria-valuemin={min}
		aria-valuemax={max}
		{disabled}
		{readonly}
		onchange={field.change}
		onkeydown={handleKeydown}
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
