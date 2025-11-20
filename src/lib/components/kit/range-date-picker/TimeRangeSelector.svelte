<script lang="ts">
	import { timeFilterLabel, type TimeFilter } from '$lib/shared/tools/date';
	import Select from '../select/Select.svelte';
	import { Calendar } from '@lucide/svelte';

	type Props = {
		options: TimeFilter[];
		value: TimeFilter;
		disabled?: boolean;
	};

	let { options, value = $bindable(), disabled = false }: Props = $props();

	if (!options.includes(value)) {
		options.unshift(value);
	}

	const selectOptions = $derived(
		options.map((option) => ({
			label: timeFilterLabel(option),
			value: option
		}))
	);
</script>

<Select options={selectOptions} bind:value {disabled}>
	{#snippet children(content: string)}
		<div class="flex w-full items-center gap-2">
			<Calendar class="size-4" />
			<span>{content}</span>
		</div>
	{/snippet}
</Select>
