<script lang="ts" generics="T, Type extends ComboboxType = 'single'">
	/**
	 * @coral/kit/combobox
	 * @version 1.0.0
	 */
	import { tick } from 'svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { cn } from '$lib/utils.js';
	import HiddenField from '../../lib/hidden-field.svelte';
	import LiveRegion from '../../lib/live-region.svelte';
	import { debounce } from '../../lib/debounce.js';
	import { onClose } from '../../lib/on-close.svelte.js';
	import { flatten, toGroups } from '../../lib/options.js';
	import { includesValue, matches } from './matching.js';
	import { selectAllVisible } from './selection.js';
	import type { Option } from '../../lib/options.js';
	import type { ComboboxProps, ComboboxType } from './types.js';

	let {
		options,
		// Left undefined rather than defaulted: `Type` is inferred, and writing a concrete
		// `'single'` into it would not be assignable to whatever the caller instantiated it as.
		// Absent means single, which is what `multiple` below reads.
		type,
		value = $bindable(),
		open = $bindable(false),
		search = $bindable(''),
		placeholder = 'Select an option...',
		searchPlaceholder = 'Search...',
		emptyMessage = 'No results found.',
		clearLabel = 'Clear selection',
		onchange,
		onsearch,
		searchDebounce = 0,
		onOpenChange,
		filter,
		shouldFilter = true,
		disabled = false,
		clearable = false,
		loading = false,
		id,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		name,
		form,
		required = false,
		serialize,
		maxDisplay = 3,
		class: className,
		contentClass,
		listClass,
		trigger,
		option: optionSnippet,
		empty,
		indicator,
		footer,
		...restProps
	}: ComboboxProps<T, Type> = $props();

	const uid = $props.id();
	const listId = `${uid}-list`;

	/** The value of the option the primitive has highlighted - see `activeId`. */
	let highlighted = $state('');

	let triggerRef = $state<HTMLButtonElement | null>(null);
	let searchRef = $state<HTMLInputElement | null>(null);

	/** Reads `searchDebounce` per call, so changing the prop takes effect without a remount. */
	const searchLater = debounce(
		(term: string) => onsearch?.(term),
		() => searchDebounce
	);

	// A pending debounce outliving the component would call `onsearch` for a screen that is gone.
	$effect(() => () => searchLater.cancel());

	const multiple = $derived(type === 'multiple');
	const toText = $derived(serialize ?? ((entry: T) => String(entry)));
	const groups = $derived(toGroups(options));
	const all = $derived(flatten(options));

	/**
	 * Command identifies an item by a string, and `T` is not one: stringifying an id is lossy, and
	 * two options can collapse onto one key. An index across all groups cannot collide with itself.
	 */
	const indexed = $derived.by(() => {
		let index = 0;
		return groups.map((group) => ({
			label: group.label,
			entries: group.options.map((option) => ({ option, index: index++ }))
		}));
	});

	/** The selection as an array, whatever `type` is, so one code path handles both. */
	const values = $derived<T[]>(
		multiple ? ((value as T[] | undefined) ?? []) : value === undefined ? [] : [value as T]
	);
	/** The options carrying these values, in list order. */
	function hydrate(entries: T[]): Option<T>[] {
		return all.filter((option) => includesValue(entries, option.value));
	}

	const selected = $derived(hydrate(values));
	const shown = $derived(selected.slice(0, maxDisplay));
	const showClear = $derived(clearable && !trigger && selected.length > 0 && !disabled);
	const overflow = $derived(Math.max(0, selected.length - maxDisplay));

	const match = $derived(filter ?? matches<T>);
	const visible = $derived(shouldFilter ? all.filter((option) => match(option, search)) : all);

	/**
	 * Filtering happens here and only here; Command is told not to filter at all. Letting it score
	 * each item cannot work - a caller's `filter` needs the whole `Option` and Command's scorer
	 * sees only strings - and ran the match twice per option per keystroke. Command keeps what it
	 * is good at, which is keyboard navigation.
	 */
	const rendered = $derived.by(() => {
		const keep = new Set(visible);
		return indexed
			.map((group) => ({
				label: group.label,
				entries: group.entries.filter((entry) => keep.has(entry.option))
			}))
			.filter((group) => group.entries.length > 0);
	});

	const noMatches = $derived(!loading && rendered.length === 0);

	/** The highlighted option's element id, while there is a list for it to be in. */
	const activeId = $derived(
		highlighted !== '' && !noMatches && !loading ? `${listId}-${highlighted}` : undefined
	);

	/**
	 * The selection is hydrated from `next` rather than read back off `selected`, so what the
	 * caller is handed cannot depend on when a derived happens to recompute.
	 */
	function commit(next: T | T[] | undefined) {
		// `type` picks the shape of `value` at runtime, which TypeScript cannot correlate with `Type`.
		value = next as never;
		if (!onchange) return;

		const entries = multiple ? (next as T[]) : next === undefined ? [] : [next as T];
		const options = hydrate(entries);
		(onchange as (selection: Option<T> | Option<T>[] | undefined) => void)(
			multiple ? options : options[0]
		);
	}

	function close() {
		open = false;
		tick().then(() => triggerRef?.focus());
	}

	/**
	 * `onchange` is called from here, `clear` and `selectAll`, nowhere else. An `$effect` on `value`
	 * would also fire on mount and on every programmatic assignment.
	 */
	function select(option: Option<T>) {
		if (option.disabled) return;

		if (multiple) {
			const current = (value as T[] | undefined) ?? [];
			const next = includesValue(current, option.value)
				? current.filter((candidate) => candidate !== option.value)
				: [...current, option.value];
			commit(next);
			// The popover stays open - picking one of several is rarely picking the last one - and
			// focus goes back to the search box, which the click moved to the list. Without this the
			// user has to re-click the input before they can narrow the list again.
			tick().then(() => searchRef?.focus());
			return;
		}

		const isSelected = value !== undefined && value === option.value;
		const next = clearable && isSelected ? undefined : option.value;
		commit(next);
		close();
	}

	function clear() {
		commit(multiple ? [] : undefined);
	}

	function selectAll() {
		if (!multiple) return;
		commit(selectAllVisible(all, visible, (value as T[] | undefined) ?? []));
	}

	function handleSearch(event: Event & { currentTarget: HTMLInputElement }) {
		if (!onsearch) return;
		searchLater(event.currentTarget.value);
	}

	/**
	 * Forgets the term on any close. Watched on `open`, not `onOpenChange`: the primitive does not
	 * report a close made by assigning `open`, which is what a footer's `close()` does.
	 */
	onClose(
		() => open,
		() => {
			searchLater.cancel();
			// The caller hears about it too, undebounced. When the server owns the search, clearing
			// only this side leaves an empty search box sitting above a list still filtered by a
			// term nobody can see any more.
			if (search !== '') onsearch?.('');
			search = '';
		}
	);
</script>

<Popover.Root bind:open {onOpenChange} {...restProps}>
	<div class="relative">
		<Popover.Trigger bind:ref={triggerRef}>
			{#snippet child({ props })}
				{#if trigger}
					{@render trigger({ props, selected, open, disabled, clear })}
				{:else}
					<Button
						{...props}
						id={id ?? (props.id as string | undefined)}
						variant="outline"
						role="combobox"
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledby}
						aria-describedby={ariaDescribedby}
						aria-invalid={ariaInvalid}
						aria-expanded={open}
						aria-required={required ? 'true' : undefined}
						{disabled}
						class={cn('w-full justify-between', className)}
					>
						<!-- The label reserves the room, not the button padding: padding would push the
						     chevron in too, stranding the clear control to the right of it. -->
						<span
							class={cn(
								'flex min-w-0 flex-1 flex-wrap items-center gap-1 text-start',
								showClear && 'pe-7'
							)}
						>
							{#if selected.length === 0}
								{placeholder}
							{:else if multiple}
								{#each shown as option (option.value)}
									<Badge variant="secondary">{option.label}</Badge>
								{/each}
								{#if overflow > 0}
									<Badge variant="outline">+{overflow}</Badge>
								{/if}
							{:else}
								<span class="min-w-0 truncate">{selected[0].label}</span>
							{/if}
						</span>
						<ChevronsUpDownIcon class="opacity-50" />
					</Button>
				{/if}
			{/snippet}
		</Popover.Trigger>

		<!-- Beside the trigger, not inside: a button within a button is invalid HTML, and browsers
		     recover by dropping one - which is how a per-badge remove control becomes unreachable. -->
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

	<Popover.Content class={cn('w-(--bits-popover-anchor-width) p-0', contentClass)}>
		<Command.Root shouldFilter={false} bind:value={highlighted}>
			<!--
				`aria-controls` and `aria-activedescendant` by hand: the primitive derives both from a
				viewport the shadcn list does not render, so a screen reader is told neither which list this
				box drives nor which option is highlighted.
			-->
			<Command.Input
				bind:ref={searchRef}
				aria-controls={listId}
				aria-activedescendant={activeId}
				placeholder={searchPlaceholder}
				bind:value={search}
				oninput={handleSearch}
			/>

			<!--
				A listbox may only own options and groups, so while it has none - nothing matches, or the
				results are on their way - it is hidden and the message sits beside it instead.
			-->
			<Command.List id={listId} class={listClass} hidden={noMatches || loading}>
				{#if !loading}
					{#each rendered as group, groupIndex (groupIndex)}
						<Command.Group heading={group.label}>
							{#each group.entries as entry (entry.index)}
								{@const isSelected = includesValue(values, entry.option.value)}
								<Command.Item
									id={`${listId}-${entry.index}`}
									value={String(entry.index)}
									disabled={entry.option.disabled}
									class="data-disabled:pointer-events-none data-disabled:opacity-50"
									data-checked={isSelected ? 'true' : undefined}
									onSelect={() => select(entry.option)}
								>
									{#if optionSnippet}
										{@render optionSnippet({ option: entry.option, selected: isSelected })}
									{:else if entry.option.description}
										<span class="flex min-w-0 flex-col">
											<span class="truncate">{entry.option.label}</span>
											<span class="truncate text-muted-foreground">
												{entry.option.description}
											</span>
										</span>
									{:else}
										{entry.option.label}
									{/if}
								</Command.Item>
							{/each}
						</Command.Group>
					{/each}
				{/if}
			</Command.List>

			{#if loading}
				<Command.Loading>
					{#if indicator}
						{@render indicator()}
					{:else}
						<div class="flex items-center justify-center py-6">
							<Spinner class="opacity-50" />
						</div>
					{/if}
				</Command.Loading>
			{/if}

			{#if !loading}
				<Command.Empty>
					{#if empty}{@render empty()}{:else}{emptyMessage}{/if}
				</Command.Empty>
			{/if}

			<!-- Typing into a field whose list is empty says nothing on its own, so the result is spoken. -->
			<LiveRegion message={noMatches && !empty ? emptyMessage : ''} />

			{#if footer}
				<div class="border-t p-1">
					{@render footer({ selected, visible, clear, selectAll, close })}
				</div>
			{/if}
		</Command.Root>
	</Popover.Content>
</Popover.Root>

{#if name}
	{#if multiple}
		{#each values as entry (entry)}
			<HiddenField {name} {form} value={toText(entry)} />
		{/each}
		<!--
			An empty selection renders no field at all, so there would be nothing for `required` to
			hold up the submit on. This is that field - present only while there is nothing to submit,
			the same shape `kit/tags-input` uses for the same reason.
		-->
		{#if required && values.length === 0}
			<HiddenField {name} {form} required value="" />
		{/if}
	{:else}
		<HiddenField {name} {form} {required} value={value === undefined ? '' : toText(value as T)} />
	{/if}
{/if}
