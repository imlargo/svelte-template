<script lang="ts" module>
	/** Written out in full so the class scanner can see every one of them. */
	const align: Record<'start' | 'center' | 'end', string> = {
		start: 'text-start',
		center: 'text-center',
		end: 'text-end'
	};
</script>

<script lang="ts" generics="T, Id extends string = string">
	/**
	 * @coral/kit/data-table
	 * @version 1.0.0
	 */
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';
	import { focusRing } from '../../lib/focus.js';
	import { idsBetween, nextSort, selectionState, toggleAll, toggleId } from '../../lib/table.js';
	import type { DataTableProps } from './types.js';

	let {
		rows,
		columns,
		getRowId,
		sort = $bindable(),
		onsortchange,
		selection = 'none',
		selected = $bindable([]),
		onselectionchange,
		onrowactivate,
		loading = false,
		loadingRows = 5,
		emptyMessage = 'Nothing to show.',
		caption,
		stickyHeader = false,
		selectAllLabel = 'Select all rows',
		selectRowLabel = () => 'Select row',
		ref = $bindable(null),
		class: className,
		rowClass,
		empty,
		footer,
		...restProps
	}: DataTableProps<T, Id> = $props();

	const selectable = $derived(selection !== 'none');
	const visibleIds = $derived(rows.map((row) => getRowId(row)));
	const headerState = $derived(selectionState(selected, visibleIds));

	/** Where a Shift-click draws its range from: the row picked without one. */
	let anchor: string | null = null;

	function commit(next: string[]) {
		selected = next;
		onselectionchange?.(next);
	}

	function headerSort(column: Id) {
		const next = nextSort(sort, column);
		sort = next;
		onsortchange?.(next);
	}

	/**
	 * Picking a row. Shift extends from the last row picked without it, the way every file list and
	 * spreadsheet behaves; a single-selection table replaces instead, since there is nothing to
	 * extend.
	 */
	function pick(id: string, event?: MouseEvent | KeyboardEvent) {
		if (selection === 'single') {
			anchor = id;
			commit(selected.includes(id) ? [] : [id]);
			return;
		}

		if (event?.shiftKey && anchor) {
			const range = idsBetween(visibleIds, anchor, id);
			const missing = range.filter((entry) => !selected.includes(entry));
			commit(
				missing.length > 0
					? [...selected, ...missing]
					: selected.filter((entry) => !range.includes(entry))
			);
			return;
		}

		anchor = id;
		commit(toggleId(selected, id));
	}

	/**
	 * A click anywhere on the row.
	 *
	 * Ignored when it landed on something that handles its own clicks - a checkbox, a row action, a
	 * link - because activating the row as well would run two things for one press. Also ignored
	 * while text is being selected, which is a drag across a cell rather than a click on a row.
	 */
	function rowClick(event: MouseEvent & { currentTarget: HTMLTableRowElement }, row: T) {
		if (!onrowactivate) return;

		const target = event.target as HTMLElement;
		if (target.closest('button, a, input, select, textarea, [role="checkbox"]')) return;
		if ((window.getSelection()?.toString().length ?? 0) > 0) return;

		onrowactivate(row);
	}

	function rowKeydown(event: KeyboardEvent & { currentTarget: HTMLTableRowElement }, row: T) {
		if (!onrowactivate || event.target !== event.currentTarget) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();
		onrowactivate(row);
	}
</script>

<div
	bind:this={ref}
	aria-busy={loading ? 'true' : undefined}
	class={cn('w-full', className)}
	{...restProps}
>
	<Table.Root>
		{#if caption}
			<Table.Caption class="sr-only">{caption}</Table.Caption>
		{/if}

		<!-- A sticky header needs an opaque surface or the rows scroll visibly through it. It is the
		     theme's own `background`, so it follows a retheme; only the opacity is Coral's. -->
		<Table.Header class={cn(stickyHeader && 'sticky top-0 z-10 bg-background')}>
			<Table.Row>
				{#if selectable}
					<Table.Head class="w-10">
						{#if selection === 'multiple'}
							<!--
								Partly selected has to read as partly selected, not empty.

								Both boxes are bound to a getter and a no-op setter: the primitive flips its own copy of
								`checked` on every press, which drifts from `selected` after a Shift range. The press is
								reported through `onclick` instead.
							-->
							<Checkbox
								bind:checked={() => headerState === 'all', () => {}}
								bind:indeterminate={() => headerState === 'some', () => {}}
								aria-label={selectAllLabel}
								disabled={loading || rows.length === 0}
								onclick={() => commit(toggleAll(selected, visibleIds))}
							/>
						{/if}
					</Table.Head>
				{/if}

				{#each columns as column (column.id)}
					{@const sorted = sort?.column === column.id ? sort.direction : undefined}
					<!--
						`aria-sort` on the cell, and the control inside it is a real button: the header is what
						assistive tech reads the state from, and the button is what the keyboard presses. A
						`<th>` with a click handler is neither.
					-->
					<Table.Head
						aria-sort={column.sortable
							? sorted === 'asc'
								? 'ascending'
								: sorted === 'desc'
									? 'descending'
									: 'none'
							: undefined}
						class={cn(column.align && align[column.align], column.class)}
					>
						{#if column.sortable}
							<button
								type="button"
								data-column={column.id}
								class={cn(
									'-mx-2 inline-flex items-center gap-1 rounded-sm px-2 py-1 hover:text-foreground',
									focusRing
								)}
								onclick={() => headerSort(column.id)}
							>
								{#if typeof column.header === 'function'}
									{@render column.header()}
								{:else}
									{column.header ?? column.id}
								{/if}

								{#if sorted === 'asc'}
									<ChevronUpIcon class="size-3.5" aria-hidden="true" />
								{:else if sorted === 'desc'}
									<ChevronDownIcon class="size-3.5" aria-hidden="true" />
								{:else}
									<ChevronsUpDownIcon class="size-3.5 opacity-50" aria-hidden="true" />
								{/if}
							</button>
						{:else if typeof column.header === 'function'}
							{@render column.header()}
						{:else}
							{column.header ?? column.id}
						{/if}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#if loading}
				<!--
					Placeholder rows rather than a spinner over an empty box: the table keeps the height and
					the column widths it is about to have, so nothing jumps when the rows arrive. Hidden from
					assistive tech, which is told what is happening by `aria-busy` on the region instead.
				-->
				{#each { length: loadingRows }, row (row)}
					<Table.Row aria-hidden="true">
						{#if selectable}
							<Table.Cell><Skeleton class="size-4" /></Table.Cell>
						{/if}
						{#each columns as column (column.id)}
							<Table.Cell class={cn(column.align && align[column.align], column.class)}>
								<Skeleton class="h-4 w-full" />
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			{:else if rows.length === 0}
				<Table.Row>
					<Table.Cell colspan={columns.length + (selectable ? 1 : 0)}>
						{#if empty}
							{@render empty()}
						{:else}
							<Empty.Root>
								<Empty.Header>
									<Empty.Title>{emptyMessage}</Empty.Title>
								</Empty.Header>
							</Empty.Root>
						{/if}
					</Table.Cell>
				</Table.Row>
			{:else}
				{#each rows as row, index (getRowId(row))}
					{@const id = getRowId(row)}
					{@const isSelected = selected.includes(id)}
					<Table.Row
						data-state={isSelected ? 'selected' : undefined}
						aria-selected={selectable ? isSelected : undefined}
						tabindex={onrowactivate ? 0 : undefined}
						class={cn(onrowactivate && 'cursor-pointer', rowClass)}
						onclick={(event) => rowClick(event, row)}
						onkeydown={(event) => rowKeydown(event, row)}
					>
						{#if selectable}
							<Table.Cell>
								<Checkbox
									bind:checked={() => isSelected, () => {}}
									aria-label={selectRowLabel(row)}
									onclick={(event) => pick(id, event)}
								/>
							</Table.Cell>
						{/if}

						{#each columns as column (column.id)}
							<Table.Cell class={cn(column.align && align[column.align], column.class)}>
								{#if column.cell}
									{@render column.cell({ row, index })}
								{:else}
									{column.value?.(row) ?? ''}
								{/if}
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			{/if}
		</Table.Body>
	</Table.Root>

	{@render footer?.()}
</div>
