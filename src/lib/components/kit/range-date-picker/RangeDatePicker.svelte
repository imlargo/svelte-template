<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import type { DateRange } from 'bits-ui';
	import {
		CalendarDate,
		DateFormatter,
		type DateValue,
		getLocalTimeZone
	} from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	type RangeDateValue = {
		start: CalendarDate;
		end: CalendarDate;
	};

	type Props = {
		value: RangeDateValue;
	};

	let { value = $bindable() }: Props = $props();

	const df = new DateFormatter('en-US', {
		dateStyle: 'medium'
	});

	let startValue: DateValue | undefined = $state(value.start);

	function onStartValueChange(v: DateValue | undefined) {
		startValue = v;
		value.start = v as CalendarDate;
	}
</script>

<div class="grid gap-2">
	<Popover.Root>
		<Popover.Trigger
			class={cn(
				buttonVariants({ variant: 'outline' }),
				!value && 'text-muted-foreground max-w-max'
			)}
		>
			<CalendarIcon class="mr-2 size-4" />
			{#if value && value.start}
				{#if value.end}
					{df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
						value.end.toDate(getLocalTimeZone())
					)}
				{:else}
					{df.format(value.start.toDate(getLocalTimeZone()))}
				{/if}
			{:else if startValue}
				{df.format(startValue.toDate(getLocalTimeZone()))}
			{:else}
				Pick a date
			{/if}
		</Popover.Trigger>
		<Popover.Content class="w-auto p-0" align="start">
			<RangeCalendar bind:value {onStartValueChange} numberOfMonths={2} />
		</Popover.Content>
	</Popover.Root>
</div>
