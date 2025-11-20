<script lang="ts">
	import { tick } from 'svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Check, ChevronsUpDown } from '@lucide/svelte';

	type Option = {
		value: string | number;
		label: string;
	};

	type Props = {
		value: string | number;
		options: Option[];
		triggerPlaceholder: string;
		searchPlaceholder: string;
		notFoundPlaceholder: string;
		disabled?: boolean;
	};

	let {
		value = $bindable(),
		options,
		triggerPlaceholder,
		searchPlaceholder,
		notFoundPlaceholder,
		disabled = false
	}: Props = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);
	const selectedOptionLabel = $derived(options.find((f) => f.value === value)?.label);

	const normalizeString = (str: string) =>
		str
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();

	function customFilter(commandValue: string, search: string | number): number {
		const normalizedSearch = normalizeString(search.toString());
		const option = options.find((o) => o.value === commandValue);
		const normalizedCommandValue = normalizeString(option?.label || '');
		return normalizedCommandValue.includes(normalizedSearch) ? 1 : 0;
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="flex w-full items-center justify-between"
				role="combobox"
				aria-expanded={open}
				{disabled}
			>
				{selectedOptionLabel || triggerPlaceholder}
				<ChevronsUpDown class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-full p-0">
		<Command.Root filter={customFilter}>
			<Command.Input
				class="border-0 ring-0 outline-0 focus:border-0"
				placeholder={searchPlaceholder}
			/>
			<Command.List>
				<Command.Empty>{notFoundPlaceholder}</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item
							value={option.value as unknown as string}
							onSelect={() => {
								value = option.value;
								closeAndFocusTrigger();
							}}
						>
							<Check class={cn(value !== option.value && 'text-transparent')} />
							{option.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
