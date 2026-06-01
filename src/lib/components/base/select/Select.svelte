<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import type { Snippet } from 'svelte';

	type Option = {
		value: string;
		label: string;
	};

	type Props = {
		options: Option[];
		value?: string;
		placeholder?: string;
		children?: Snippet<[string]>;
		onchange?: (value: any) => void;
		disabled?: boolean;
	};

	let {
		value = $bindable(),
		options,
		placeholder = 'Please select an option...',
		onchange,
		disabled = false,
		children
	}: Props = $props();

	const triggerContent = $derived(options.find((op) => op.value === value)?.label ?? placeholder);

	$effect(() => {
		if (onchange) {
			onchange(value || '');
		}
	});
</script>

<Select.Root type="single" bind:value {disabled}>
	<Select.Trigger class="w-full">
		{#if children}
			{@render children(triggerContent)}
		{:else}
			{triggerContent}
		{/if}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each options as option (option.value)}
				<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
