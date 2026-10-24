<script lang="ts" generics="T = unknown">
	/**
	 * @coral/kit/tree-view
	 * @version 1.1.0
	 */
	import { tick } from 'svelte';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn } from '#lib/utils.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { focusRingInset } from '../../lib/focus.js';
	import { ancestorsOf, expandableSiblings, typeahead, visibleRows } from './tree.js';
	import type { TreeRow } from './tree.js';
	import type { NodeContext, TreeViewProps } from './types.js';

	const defaults = getCoralDefaults('kit/tree-view');

	let {
		nodes,
		expanded = $bindable([]),
		selected = $bindable(),
		onselect,
		onexpandedchange,
		locale = defaults.locale,
		label,
		toggleLabel = defaults.toggleLabel,
		ref = $bindable(null),
		class: className,
		rowClass,
		node: nodeSnippet,
		icon,
		actions,
		...restProps
	}: TreeViewProps<T> = $props();

	const uid = $props.id();

	const open = $derived(new Set(expanded));
	const rows = $derived(visibleRows(nodes, open));

	/**
	 * The row Tab lands on - one tab stop for the whole tree, arrows inside it. Held as an id so it
	 * survives rows appearing and disappearing above it. When it is no longer visible, the selected
	 * row takes over, then the first: a tree must never end up with no way in from the keyboard.
	 */
	let focusedId = $state<string | undefined>();
	const tabbableId = $derived.by(() => {
		for (const candidate of [focusedId, selected]) {
			if (candidate !== undefined && rows.some((row) => row.node.id === candidate))
				return candidate;
		}
		return rows[0]?.node.id;
	});

	const rowId = (id: string) => `${uid}-${id}`;

	function setExpanded(next: string[]) {
		expanded = next;
		onexpandedchange?.(next);
	}

	function focusRow(id: string) {
		focusedId = id;
		// After a tick: the row may only just have been drawn, by an expand in the same key press.
		tick().then(() => document.getElementById(rowId(id))?.focus());
	}

	function toggle(row: TreeRow<T>) {
		if (!row.expandable) return;

		if (!row.expanded) {
			setExpanded([...expanded, row.node.id]);
			return;
		}

		setExpanded(expanded.filter((id) => id !== row.node.id));
		// Collapsing an ancestor of the focused row hides it. Focus follows to the row that closed,
		// or the keyboard would be left on an element that no longer exists.
		if (focusedId && ancestorsOf(nodes, focusedId).includes(row.node.id)) {
			const inside = ref?.contains(document.activeElement) ?? false;
			focusedId = row.node.id;
			if (inside) focusRow(row.node.id);
		}
	}

	function select(row: TreeRow<T>) {
		if (row.node.disabled) return;
		selected = row.node.id;
		onselect?.(row.node);
	}

	let query = '';
	let queryTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(queryTimer));

	const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

	/**
	 * Keeps every control in a row's actions out of the tab order, for as long as the row lives. The
	 * tree is one tab stop with the arrows inside it, and sequential focus visiting every action of
	 * every row would undo that; the actions are reached from their row instead - see `handleKeydown`.
	 */
	function untabbable(node: HTMLElement) {
		const demote = () => {
			for (const control of node.querySelectorAll<HTMLElement>(FOCUSABLE)) control.tabIndex = -1;
		};
		demote();
		const observer = new MutationObserver(demote);
		observer.observe(node, { childList: true, subtree: true });
		return () => observer.disconnect();
	}

	const actionsOf = (row: HTMLElement) =>
		Array.from(row.querySelectorAll<HTMLElement>(`[data-coral-actions] :is(${FOCUSABLE})`));

	/**
	 * Tab inside the actions of one row. From the row: into its first control. Between controls: the
	 * next or the previous. Past the last one, or backwards past the first, focus returns to the row
	 * before the browser moves on, so Tab leaves the tree from the row the same way it arrived - the
	 * controls themselves are not in the sequential order. Escape goes back to the row too.
	 */
	function handleActionsKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		const row = event.currentTarget;
		const controls = actionsOf(row);
		const inside = event.target !== row;
		const at = controls.indexOf(event.target as HTMLElement);

		if (event.key === 'Escape' && inside) {
			event.preventDefault();
			event.stopPropagation();
			row.focus();
			return true;
		}
		if (event.key !== 'Tab') return inside;

		if (!inside) {
			if (event.shiftKey || controls.length === 0) return false;
			event.preventDefault();
			controls[0].focus();
			return true;
		}

		const next = controls[at + (event.shiftKey ? -1 : 1)];
		if (next) {
			event.preventDefault();
			next.focus();
		} else if (event.shiftKey) {
			event.preventDefault();
			row.focus();
		} else {
			// Not prevented: the browser moves on from the row, which is the tree's only tab stop.
			row.focus();
		}
		return true;
	}

	/** On each row rather than delegated from the tree, so the row that has focus is the one it reads. */
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		// A key inside the actions belongs to the control that has focus, Tab and Escape aside.
		if (handleActionsKeydown(event)) return;

		const index = rows.findIndex((row) => row.node.id === tabbableId);
		const row = rows[index];
		if (!row) return;

		// Left and right follow reading direction: in a right-to-left tree, children open leftwards.
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		const inward = rtl ? 'ArrowLeft' : 'ArrowRight';
		const outward = rtl ? 'ArrowRight' : 'ArrowLeft';

		const go = (to: number) => {
			const target = rows[Math.max(0, Math.min(rows.length - 1, to))];
			if (target) focusRow(target.node.id);
		};

		switch (event.key) {
			case 'ArrowDown':
				go(index + 1);
				break;
			case 'ArrowUp':
				go(index - 1);
				break;
			case 'Home':
				go(0);
				break;
			case 'End':
				go(rows.length - 1);
				break;
			case inward:
				// Closed: open it. Open: step into its first child. Leaf: nothing, by the pattern.
				if (row.expandable && !row.expanded) toggle(row);
				else if (row.expanded && rows[index + 1]?.parentId === row.node.id) go(index + 1);
				break;
			case outward:
				// Open: close it. Otherwise: step out to the parent.
				if (row.expanded) toggle(row);
				else if (row.parentId !== undefined) focusRow(row.parentId);
				break;
			case 'Enter':
			case ' ':
				select(row);
				break;
			case '*':
				setExpanded([...new Set([...expanded, ...expandableSiblings(rows, row)])]);
				break;
			default: {
				if (event.key.length !== 1) return;
				// Letters typed in quick succession build one query; a pause starts a new one.
				query += event.key;
				clearTimeout(queryTimer);
				queryTimer = setTimeout(() => (query = ''), 500);
				const match = typeahead(rows, index, query, locale);
				if (match !== -1) go(match);
				break;
			}
		}

		event.preventDefault();
	}

	function contextFor(row: TreeRow<T>): NodeContext<T> {
		return { ...row, selected: row.node.id === selected, toggle: () => toggle(row) };
	}
</script>

<!--
	`role="tree"` with flat `treeitem` rows that carry their own level, position and set size. The
	structure is announced from those attributes, so nothing is lost by not nesting `group`s, and the
	focus ring can go on a row without also ringing every row underneath it.
-->
<div
	bind:this={ref}
	role="tree"
	aria-label={label}
	class={cn('flex flex-col [--coral-indent:--spacing(4)]', className)}
	{...restProps}
>
	{#each rows as row (row.node.id)}
		{@const context = contextFor(row)}
		<div
			id={rowId(row.node.id)}
			role="treeitem"
			aria-level={row.level}
			aria-posinset={row.position}
			aria-setsize={row.siblings}
			aria-expanded={row.expandable ? row.expanded : undefined}
			aria-selected={context.selected}
			aria-disabled={row.node.disabled ? 'true' : undefined}
			tabindex={row.node.id === tabbableId ? 0 : -1}
			data-state={row.expanded ? 'open' : row.expandable ? 'closed' : undefined}
			data-selected={context.selected || undefined}
			data-disabled={row.node.disabled || undefined}
			class={cn('flex cursor-default items-center gap-1 select-none', focusRingInset, rowClass)}
			onfocusin={() => (focusedId = row.node.id)}
			onkeydown={handleKeydown}
			onclick={(event) => {
				// A click on one of the row's actions is that action's, not a selection.
				if ((event.target as Element).closest('[data-coral-actions]')) return;
				focusedId = row.node.id;
				select(row);
			}}
		>
			<!--
				The indent is an element, not padding on the row: padding would be merged with `rowClass`,
				where a `px-2` quietly wins and every level renders flush.
			-->
			<span
				aria-hidden="true"
				class="shrink-0"
				style:width="calc(var(--coral-indent) * {row.level - 1})"
			></span>

			{#if row.expandable}
				<!--
					A mouse target only, hidden from assistive tech: from the keyboard, the arrows do what
					this does, and a second focusable control inside a treeitem breaks the one-tab-stop
					model the pattern depends on.
				-->
				<span
					data-coral-toggle
					aria-hidden="true"
					title={toggleLabel?.(row.node, row.expanded)}
					class="flex shrink-0 cursor-pointer items-center justify-center"
					onclick={(event) => {
						event.stopPropagation();
						focusedId = row.node.id;
						toggle(row);
					}}
				>
					{#if icon}
						{@render icon(context)}
					{:else}
						<ChevronRightIcon
							class={cn(
								'size-4 transition-transform',
								// Only one rotation at a time: both would fight, and in a right-to-left
								// tree an open node would point sideways instead of down.
								row.expanded ? 'rotate-90' : 'rtl:rotate-180'
							)}
						/>
					{/if}
				</span>
			{:else}
				<!-- Keeps leaves aligned with their expandable siblings' labels. -->
				<span aria-hidden="true" class="size-4 shrink-0"></span>
			{/if}

			{#if nodeSnippet}
				{@render nodeSnippet(context)}
			{:else}
				<span class="min-w-0 truncate">{row.node.label}</span>
			{/if}

			{#if actions}
				<span data-coral-actions class="ms-auto flex shrink-0 items-center" {@attach untabbable}>
					{@render actions(context)}
				</span>
			{/if}
		</div>
	{/each}
</div>
