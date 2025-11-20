<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import {
		type DateValue,
		DateFormatter,
		getLocalTimeZone,
		parseDate
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { isValidDate } from '$lib/shared/format/date.js';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	type Props = {
		value: string;
		onchange?: (value: string) => void;
		disabled?: boolean;
	};

	let { value = $bindable(), onchange, disabled = false }: Props = $props();

	let internalValue = $state<DateValue>();

	$effect(() => {
		if (value && isValidDate(value)) {
			try {
				internalValue = parseDate(value);
			} catch (error) {
				// Invalid date format, set to undefined
				internalValue = undefined;
			}
		} else {
			internalValue = undefined;
		}
	});

	$effect(() => {
		if (internalValue) {
			value = internalValue.toString();
		}
	});

	function handleChange(newValue: string) {
		value = newValue;

		if (onchange) {
			onchange(newValue);
		}
	}
</script>

<Popover.Root>
	<Popover.Trigger {disabled}>
		{#snippet child({ props })}
			<Button
				{disabled}
				variant="outline"
				class={cn(
					'w-full justify-start text-left font-normal',
					!internalValue && 'text-muted-foreground'
				)}
				{...props}
			>
				<CalendarIcon class="mr-2 size-4" />
				{internalValue ? df.format(internalValue.toDate(getLocalTimeZone())) : 'Select a date'}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar
			bind:value={internalValue}
			onValueChange={(v) => {
				if (onchange) {
					handleChange(v?.toString() ?? '');
				}
			}}
			type="single"
			initialFocus
		/>
	</Popover.Content>
</Popover.Root>
