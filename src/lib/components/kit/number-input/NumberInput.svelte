<script lang="ts">
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import { Input } from '$lib/components/ui/input';
	import { MinusIcon, PlusIcon } from '@lucide/svelte';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		id?: string;
		value?: number;
		onChange?: (value: number) => void;
		class?: string;
		placeholder?: string;
		size?: number;
		maxlength?: number;
		min?: number;
		max?: number;
		step?: number;
	};

	let {
		id,
		value = $bindable(),
		onChange,
		class: className,
		placeholder,
		size,
		maxlength,
		min = 0,
		max = Infinity,
		step = 1
	}: Props = $props();

	function increment() {
		if (typeof value !== 'number') value = 0;
		const newValue = Math.min(max, value + step);
		if (newValue !== value) {
			value = newValue;
			onChange?.(value);
		}
	}

	function decrement() {
		if (typeof value !== 'number') value = 0;
		const newValue = Math.max(min, value - step);
		if (newValue !== value) {
			value = newValue;
			onChange?.(value);
		}
	}

	// Estado de los botones según los límites
	const isDecrementDisabled = $derived(typeof value !== 'number' ? false : value <= min);
	const isIncrementDisabled = $derived(typeof value !== 'number' ? false : value >= max);

	function handleInputChange(v: number) {
		value = v;
		onChange?.(value);
	}
</script>

<ButtonGroup.Root>
	<Button
		variant="outline"
		size="icon-sm"
		type="button"
		aria-label="Decrement"
		onclick={decrement}
		disabled={isDecrementDisabled}
	>
		<MinusIcon />
	</Button>

	<Input
		{placeholder}
		{size}
		{maxlength}
		{min}
		{max}
		{step}
		{id}
		{value}
		type="number"
		onchange={(e) => handleInputChange(Number(e.currentTarget.value))}
		class={cn(
			'h-8 w-14 text-center font-mono',
			className,
			'text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
		)}
	/>

	<Button
		variant="outline"
		size="icon-sm"
		type="button"
		aria-label="Increment"
		onclick={increment}
		disabled={isIncrementDisabled}
	>
		<PlusIcon />
	</Button>
</ButtonGroup.Root>
