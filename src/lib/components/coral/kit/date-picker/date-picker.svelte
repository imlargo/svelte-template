<script lang="ts" generics="Type extends DatePickerType = 'single'">
	/**
	 * @coral/kit/date-picker
	 * @version 1.0.0
	 */
	import { tick } from 'svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import HiddenField from '../../lib/hidden-field.svelte';
	import { formatDay, formatDayRange, isSameDay, isSameRange } from './format.js';
	import { activePreset, resolvePreset } from './presets.js';
	import type { Preset } from './presets.js';
	import type {
		DatePickerProps,
		DatePickerType,
		DatePickerValue,
		DateRange,
		DateValue
	} from './types.js';

	let {
		// Undefined, not defaulted: `Type` is inferred, so a concrete `'single'` would not be
		// assignable to whatever the caller instantiated it as. Absent means single.
		type,
		value = $bindable(),
		open = $bindable(false),
		month = $bindable(),
		presets,
		placeholder = 'Select a date...',
		locale = 'en-US',
		format = { dateStyle: 'medium' },
		disabled = false,
		clearable = false,
		clearLabel = 'Clear date',
		name,
		endName,
		form,
		required = false,
		serialize,
		id,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		align = 'start',
		class: className,
		contentClass,
		trigger,
		footer,
		onchange,
		onOpenChange,
		...restProps
	}: DatePickerProps<Type> = $props();

	let triggerRef = $state<HTMLButtonElement | null>(null);

	const isRange = $derived(type === 'range');
	const toText = $derived(serialize ?? ((day: DateValue) => String(day)));

	/** The selection read as each shape, so one code path per shape stays readable. */
	const day = $derived(isRange ? undefined : (value as DateValue | undefined));
	const range = $derived(isRange ? (value as DateRange | undefined) : undefined);

	/**
	 * A half-picked range counts as selected. It is what the calendar is showing, and a trigger
	 * that says "Select a date..." while a start day sits highlighted is lying about state.
	 */
	const empty = $derived(isRange ? !range?.start && !range?.end : day === undefined);

	/**
	 * The preset the current selection came from. Identity comparison would never match: a preset
	 * relative to now hands back a fresh value on every call.
	 */
	const active = $derived.by(() => {
		if (!presets?.length || empty) return undefined;
		// Narrowed by `isRange`, which TypeScript cannot correlate with `Type` (a runtime prop).
		return isRange
			? activePreset(presets as unknown as Preset<DateRange>[], range, isSameRange)
			: activePreset(presets as unknown as Preset<DateValue>[], day, isSameDay);
	});

	/**
	 * What the trigger prints. A preset's label wins over the dates it stands for: "Last 7 days"
	 * is what the user chose, and two dates make them do arithmetic to recognise their own pick.
	 */
	const label = $derived.by(() => {
		if (active) return active.label;
		if (empty) return placeholder;
		return isRange
			? formatDayRange(range as DateRange, locale, format)
			: formatDay(day as DateValue, locale, format);
	});

	// A custom trigger positions itself; Coral's absolutely-placed clear control would land
	// somewhere arbitrary on it. `clear` is handed to the snippet instead.
	const showClear = $derived(clearable && !trigger && !empty && !disabled);

	function close() {
		open = false;
		tick().then(() => triggerRef?.focus());
	}

	/**
	 * `onchange` is called from here, `pick` and `clear`, nowhere else. An `$effect` on `value`
	 * would also fire on mount and on every programmatic assignment. The calendar owns the write -
	 * `value` is bound to it - so these only report and close.
	 */
	function handleDayChange(next: DateValue | undefined) {
		onchange?.(next as DatePickerValue<Type>);
		close();
	}

	/**
	 * A range passes through a half-picked state, and both of these were bugs in the hand-rolled
	 * version: it closes when the range is *complete*, not on the first click, and `onchange` skips
	 * the half state - a caller that fetches on change would request a range with no end. Anyone
	 * wanting the intermediate state has it through `bind:value`, written on every click.
	 */
	function handleRangeChange(next: DateRange) {
		const whole = Boolean(next?.start) && Boolean(next?.end);
		const half = Boolean(next?.start) !== Boolean(next?.end);

		if (!half) onchange?.(next as DatePickerValue<Type>);
		if (whole) close();
	}

	function pick(preset: Preset<NonNullable<DatePickerValue<Type>>>) {
		const next = resolvePreset(preset);
		value = next;
		onchange?.(next);
		close();
	}

	/** An empty range rather than `undefined`, which is how the calendar spells "nothing picked". */
	function clear() {
		const next = (
			isRange ? { start: undefined, end: undefined } : undefined
		) as DatePickerValue<Type>;
		value = next;
		onchange?.(next);
	}
</script>

<Popover.Root bind:open {onOpenChange}>
	<div class="relative">
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				{#if trigger}
					{@render trigger({ props, value, label, empty, open, disabled, clear })}
				{:else}
					<Button
						{...props}
						id={id ?? (props.id as string | undefined)}
						variant="outline"
						{disabled}
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledby}
						aria-describedby={ariaDescribedby}
						aria-invalid={ariaInvalid}
						aria-required={required ? 'true' : undefined}
						class={cn('w-full justify-between', className)}
					>
						<!-- The label reserves the room, not the button padding: padding would push the
						     icon in too, stranding the clear control to the right of it. -->
						<span
							class={cn(
								'min-w-0 flex-1 truncate text-start',
								empty && 'text-muted-foreground',
								showClear && 'pe-7'
							)}
						>
							{label}
						</span>
						<CalendarIcon class="opacity-50" />
					</Button>
				{/if}
			{/snippet}
		</Popover.Trigger>

		<!-- Beside the trigger, not inside: a button within a button is invalid HTML, and browsers
		     recover by dropping one of the two. -->
		{#if showClear}
			<Button
				type="button"
				variant="ghost"
				size="icon-xs"
				class="absolute inset-y-0 end-7 my-auto"
				aria-label={clearLabel}
				onclick={clear}
			>
				<XIcon class="opacity-50" />
			</Button>
		{/if}
	</div>

	<Popover.Content {align} class={cn('w-auto overflow-hidden p-0', contentClass)}>
		<div class="flex flex-col sm:flex-row">
			{#if presets?.length}
				<div class="flex gap-1 overflow-x-auto border-b p-2 sm:flex-col sm:border-e sm:border-b-0">
					{#each presets as preset (preset.label)}
						<Button
							type="button"
							variant={preset === active ? 'secondary' : 'ghost'}
							aria-pressed={preset === active}
							class="justify-start whitespace-nowrap"
							onclick={() => pick(preset)}
						>
							{preset.label}
						</Button>
					{/each}
				</div>
			{/if}

			<!--
				`restProps` is typed against whichever calendar `Type` selected, and TypeScript cannot
				narrow a conditional type it has not resolved yet - the cast is the same one shadcn's
				own calendar makes for `value`.
			-->
			{#if isRange}
				<RangeCalendar
					bind:value={value as never}
					bind:placeholder={month}
					{locale}
					{disabled}
					onValueChange={handleRangeChange}
					{...restProps as Record<string, unknown>}
				/>
			{:else}
				<Calendar
					type="single"
					bind:value={value as never}
					bind:placeholder={month}
					{locale}
					{disabled}
					onValueChange={handleDayChange}
					{...restProps as Record<string, unknown>}
				/>
			{/if}
		</div>

		{#if footer}
			<div class="border-t p-2">
				{@render footer({ value, clear, close })}
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>

<!--
	`required` is put on both ends of a range, so a half-picked one holds the submit up the same way
	an empty one does. Half a range is not a selection - it is the user mid-gesture, which is the
	same reading `onchange` takes.
-->
{#if name}
	{#if isRange}
		<HiddenField {name} {form} {required} value={range?.start ? toText(range.start) : ''} />
		<HiddenField
			name={endName ?? `${name}-end`}
			{form}
			{required}
			value={range?.end ? toText(range.end) : ''}
		/>
	{:else}
		<HiddenField {name} {form} {required} value={day ? toText(day) : ''} />
	{/if}
{/if}
