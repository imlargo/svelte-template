<script lang="ts">
	import { timeFilterLabel, type TimeFilter } from '$lib/utils/date';
	import Select from '../select/Select.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';

	type Props = {
		options: TimeFilter[];
		value: TimeFilter;
		disabled?: boolean;
	};

	let { options, value = $bindable(), disabled = false }: Props = $props();

	// The current value is always selectable, even when it is not one of the
	// offered options. Derived rather than pushed into `options`: that mutated a
	// prop and captured its initial value, so later changes were ignored.
	const selectOptions = $derived(
		(options.includes(value) ? options : [value, ...options]).map((option) => ({
			label: timeFilterLabel(option),
			value: option
		}))
	);
</script>

<Select options={selectOptions} bind:value {disabled}>
	{#snippet children(content: string)}
		<div class="flex w-full items-center gap-2">
			<CalendarIcon class="size-4" />
			<span>{content}</span>
		</div>
	{/snippet}
</Select>
