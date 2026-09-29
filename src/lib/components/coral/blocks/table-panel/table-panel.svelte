<script lang="ts" generics="T, Id extends string = string">
	/**
	 * @coral/blocks/table-panel
	 * @version 1.0.0
	 */
	import { untrack } from 'svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { NativeSelect, NativeSelectOption } from '$lib/components/ui/native-select/index.js';
	import { cn } from '$lib/utils.js';
	import DataTable from '../../kit/data-table/data-table.svelte';
	import SearchInput from '../../kit/search-input/search-input.svelte';
	import { buildPanel } from './panel.js';
	import type { TablePanelProps } from './types.js';

	let {
		rows,
		columns,
		getRowId,
		search = $bindable(''),
		searchText,
		searchable = true,
		searchPlaceholder = 'Search',
		sort = $bindable(),
		sorting,
		page = $bindable(1),
		pageSize = $bindable(10),
		pageSizes = [10, 25, 50],
		selection = 'none',
		selected = $bindable([]),
		loading = false,
		emptyTitle = 'Nothing here yet.',
		emptyDescription,
		noResultsTitle = 'No results.',
		noResultsDescription = 'Try a different search.',
		caption,
		rangeLabel = ({ from, to, matched }) => `${from}-${to} of ${matched}`,
		selectedLabel = (count) => `${count} selected`,
		clearLabel = 'Clear selection',
		pageSizeLabel = 'Rows per page',
		ref = $bindable(null),
		class: className,
		toolbar,
		bulk,
		...restProps
	}: TablePanelProps<T, Id> = $props();

	/**
	 * The field's text as typed. `search` is the trimmed, debounced term the table filters by, and
	 * binding both to one variable writes the trimmed term back and eats a typed space.
	 */
	let draft = $state(untrack(() => search));

	// Only `search` is tracked, so typing never re-runs this; it is for a term set from code.
	$effect(() => {
		const term = search;
		untrack(() => {
			if (term !== draft.trim()) draft = term;
		});
	});

	/**
	 * What a search compares against, when the caller has not said. Every column that holds a value,
	 * which is the set a reader can actually see - searching a field that is not on screen returns
	 * rows for reasons nobody can explain.
	 */
	const text = $derived(
		searchText ??
			((row: T) =>
				columns.map((column) => {
					const value = column.value?.(row) ?? null;
					// A date is left out: `String(date)` is the engine's own formatting in one language, so
					// searching "March" would match by accident and "marzo" never would. A column that
					// should be searched by its formatted date passes `searchText`.
					return value instanceof Date ? null : value;
				}))
	);

	const panel = $derived(
		buildPanel({
			rows,
			term: search,
			text,
			sort,
			sorting: {
				value: (row: T, column: Id) =>
					columns.find((entry) => entry.id === column)?.value?.(row) ?? null,
				...sorting
			},
			page,
			pageSize
		})
	);

	/**
	 * The page the panel settled on, written back.
	 *
	 * Filtering a list down while reading page 7 leaves the asked-for page past the end, and the
	 * panel already draws the last one instead. Putting that back makes the paginator agree with the
	 * table, rather than highlighting a page nobody is looking at.
	 */
	$effect(() => {
		if (page !== panel.page) page = panel.page;
	});

	const selectedRows = $derived(rows.filter((row) => selected.includes(getRowId(row))));

	function changePageSize(size: number) {
		pageSize = size;
		// Back to the first page: the row that was at the top of page 3 is not on page 3 of a list cut
		// into different pieces.
		page = 1;
	}
</script>

<div bind:this={ref} class={cn('flex w-full flex-col gap-3', className)} {...restProps}>
	{#if searchable || toolbar || bulk}
		<div class="flex flex-wrap items-center gap-2">
			{#if searchable}
				<SearchInput
					bind:value={draft}
					onsearch={(term) => (search = term)}
					placeholder={searchPlaceholder}
					aria-label={searchPlaceholder}
					groupClass="max-w-64"
				/>
			{/if}

			{@render toolbar?.()}

			<!--
				The bulk bar takes the end of the toolbar rather than a row of its own: a bar that appears
				between the controls and the table pushes every row down the moment a checkbox is ticked,
				and the row under the pointer is no longer the row that was there.
			-->
			{#if bulk && selected.length > 0}
				<div class="ms-auto flex items-center gap-2">
					<span class="text-muted-foreground">{selectedLabel(selected.length)}</span>
					{@render bulk({
						rows: selectedRows,
						ids: selected,
						clear: () => (selected = [])
					})}
					<Button variant="ghost" size="sm" onclick={() => (selected = [])}>{clearLabel}</Button>
				</div>
			{/if}
		</div>
	{/if}

	<DataTable
		rows={panel.rows}
		{columns}
		{getRowId}
		{selection}
		{loading}
		{caption}
		bind:sort
		bind:selected
		emptyMessage={panel.searching ? noResultsTitle : emptyTitle}
	>
		{#snippet empty()}
			<!--
				Two different sentences, because they are two different situations: a table with nothing
				in it yet needs to say how something gets there, and a search that matched nothing needs
				to say that the rows are there but the term does not fit them.
			-->
			<Empty.Root>
				<Empty.Header>
					<Empty.Title>{panel.searching ? noResultsTitle : emptyTitle}</Empty.Title>
					{#if panel.searching ? noResultsDescription : emptyDescription}
						<Empty.Description>
							{panel.searching ? noResultsDescription : emptyDescription}
						</Empty.Description>
					{/if}
				</Empty.Header>
			</Empty.Root>
		{/snippet}

		{#snippet footer()}
			{#if !loading && panel.matched.length > 0}
				<div class="flex flex-wrap items-center justify-between gap-3 pt-3">
					<p class="text-muted-foreground">
						{rangeLabel({
							from: panel.from,
							to: panel.to,
							matched: panel.matched.length,
							total: panel.total
						})}
					</p>

					<div class="flex items-center gap-4">
						{#if pageSizes.length > 1 && pageSize > 0}
							<!--
								A native select, inside a real `<label>`: it is a short list of known numbers, the
								label has to be attached to something labelable, and the platform's own control is
								the one every reader already knows how to work.
							-->
							<label class="flex items-center gap-2 text-muted-foreground">
								{pageSizeLabel}
								<NativeSelect
									size="sm"
									value={pageSize}
									onchange={(event) => changePageSize(Number(event.currentTarget.value))}
								>
									{#each pageSizes as size (size)}
										<NativeSelectOption value={size}>{size}</NativeSelectOption>
									{/each}
								</NativeSelect>
							</label>
						{/if}

						{#if panel.pages > 1}
							<!-- The page window, the ellipses and the disabled ends are the primitive's. -->
							<Pagination.Root
								count={panel.matched.length}
								perPage={pageSize}
								bind:page
								class="mx-0 w-auto"
							>
								{#snippet children({ pages, currentPage })}
									<Pagination.Content>
										<Pagination.Item>
											<Pagination.PrevButton />
										</Pagination.Item>

										{#each pages as entry (entry.key)}
											{#if entry.type === 'ellipsis'}
												<Pagination.Item>
													<Pagination.Ellipsis />
												</Pagination.Item>
											{:else}
												<Pagination.Item>
													<Pagination.Link page={entry} isActive={currentPage === entry.value}>
														{entry.value}
													</Pagination.Link>
												</Pagination.Item>
											{/if}
										{/each}

										<Pagination.Item>
											<Pagination.NextButton />
										</Pagination.Item>
									</Pagination.Content>
								{/snippet}
							</Pagination.Root>
						{/if}
					</div>
				</div>
			{/if}
		{/snippet}
	</DataTable>
</div>
