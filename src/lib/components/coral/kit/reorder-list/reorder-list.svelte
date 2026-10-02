<script lang="ts" generics="T">
	/**
	 * @coral/kit/reorder-list
	 * @version 1.0.0
	 */
	import { flushSync } from 'svelte';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import { cn } from '#lib/utils.js';
	import { Announcer } from '../../lib/announce.svelte.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import { focusRing } from '../../lib/focus.js';
	import { keyTarget, move, targetIndex } from './reorder.js';
	import type { HandleProps, ItemContext, ReorderListProps } from './types.js';

	let {
		items = $bindable([]),
		getKey = (item: T) => item,
		getLabel = (item: T) => String(item),
		onreorder,
		disabled = false,
		handleLabel = (label: string) => `Reorder ${label}`,
		instructions = 'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
		grabbed = (label: string, position: number, total: number) =>
			`${label} picked up. Position ${position} of ${total}.`,
		moved = (label: string, position: number, total: number) =>
			`${label} moved to position ${position} of ${total}.`,
		dropped = (label: string, position: number, total: number) =>
			`${label} dropped at position ${position} of ${total}.`,
		cancelled = (label: string, position: number, total: number) =>
			`Move cancelled. ${label} returned to position ${position} of ${total}.`,
		ref = $bindable(null),
		class: className,
		itemClass,
		item: itemSnippet,
		row: rowSnippet,
		onpointermove,
		onpointerup,
		onpointercancel,
		onlostpointercapture,
		...restProps
	}: ReorderListProps<T> = $props();

	const uid = $props.id();

	type Drag = {
		mode: 'pointer' | 'keyboard';
		key: unknown;
		/** Where the entry was when the drag began - what a cancel restores, and `from` on drop. */
		from: number;
		pointerId?: number;
		startY?: number;
		startTop?: number;
	};

	/**
	 * The order while a drag is live. The rows move as the pointer crosses them, but `items` is only
	 * written on drop: a bound array that changed on every crossing would hand a caller persisting
	 * through `$effect` a request per row passed, most of them for orders nobody chose.
	 */
	let draft = $state<T[] | null>(null);
	let drag = $state<Drag | null>(null);
	let offset = $state(0);
	const announcer = new Announcer();

	/** Set while rows are being moved in the DOM, whose blur must not read as the reader leaving. */
	let moving = false;

	const shown = $derived(draft ?? items);

	function rowsOf(): HTMLElement[] {
		return Array.from(ref?.querySelectorAll<HTMLElement>(':scope > [data-coral-row]') ?? []);
	}

	function indexOfKey(list: readonly T[], key: unknown): number {
		return list.findIndex((entry) => getKey(entry) === key);
	}

	function start(mode: Drag['mode'], index: number, extra: Partial<Drag> = {}) {
		draft = [...items];
		drag = { mode, key: getKey(items[index]), from: index, ...extra };
		offset = 0;
	}

	function end() {
		draft = null;
		drag = null;
		offset = 0;
	}

	function commit() {
		if (!draft || !drag) return;
		const to = indexOfKey(draft, drag.key);
		const { from } = drag;
		const next = draft;
		end();

		if (to === -1 || to === from) return;
		items = next;
		onreorder?.(next, { item: next[to], from, to });
	}

	/**
	 * Reorders the draft and waits for the DOM to follow, since the next measurement or focus call
	 * has to see the rows where they now are.
	 */
	function reorderDraft(from: number, to: number) {
		if (!draft || from === to) return;
		moving = true;
		try {
			flushSync(() => (draft = move(draft!, from, to)));
		} finally {
			moving = false;
		}
	}

	function handlePointerDown(event: PointerEvent, index: number) {
		if (disabled || drag || event.button !== 0 || !ref) return;
		const row = rowsOf()[index];
		if (!row) return;

		// Without capture a fast pointer leaves the handle and the drag stops following it. Captured
		// on the list, not the handle: the handle's row is moved in the DOM on every swap, and moving
		// an element that holds a capture releases it - ending the drag at the first row crossed.
		ref.setPointerCapture(event.pointerId);
		event.preventDefault();
		start('pointer', index, {
			pointerId: event.pointerId,
			startY: event.clientY,
			startTop: row.offsetTop
		});
	}

	function handlePointerMove(event: PointerEvent) {
		if (drag?.mode !== 'pointer' || event.pointerId !== drag.pointerId || !draft) return;

		const delta = event.clientY - (drag.startY ?? 0);
		const current = indexOfKey(draft, drag.key);
		const rows = rowsOf();
		const row = rows[current];
		if (!row) return;

		// Layout positions: `offsetTop` ignores transforms, so neither the drag offset nor a sibling's
		// flip animation skews where a row is considered to be.
		const center = (drag.startTop ?? 0) + delta + row.offsetHeight / 2;
		const midpoints = rows.map((entry) => entry.offsetTop + entry.offsetHeight / 2);
		reorderDraft(current, targetIndex(midpoints, current, center));

		// Wherever the row now sits in the layout, it is drawn under the pointer.
		const moved = rowsOf()[indexOfKey(draft, drag.key)];
		offset = (drag.startTop ?? 0) + delta - (moved?.offsetTop ?? 0);
	}

	function handlePointerUp(event: PointerEvent) {
		if (drag?.mode !== 'pointer' || event.pointerId !== drag.pointerId) return;
		commit();
	}

	function handlePointerCancel(event: PointerEvent) {
		if (drag?.mode !== 'pointer' || event.pointerId !== drag.pointerId) return;
		end();
	}

	function focusHandle(index: number) {
		ref?.querySelector<HTMLElement>(`[data-coral-handle="${index}"]`)?.focus();
	}

	function say(announce: (label: string, position: number, total: number) => string, list: T[]) {
		if (!drag) return;
		const at = indexOfKey(list, drag.key);
		announcer.say(announce(getLabel(list[at]), at + 1, list.length));
	}

	function handleKeydown(event: KeyboardEvent, index: number) {
		if (disabled || (drag && drag.mode !== 'keyboard')) return;

		if (!drag) {
			if (event.key !== ' ' && event.key !== 'Enter') return;
			event.preventDefault();
			start('keyboard', index);
			say(grabbed, items);
			return;
		}

		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			const list = draft ?? items;
			say(dropped, list);
			commit();
			return;
		}

		if (event.key === 'Escape') {
			// Kept from closing a dialog the list sits in: this Escape belongs to the move.
			event.preventDefault();
			event.stopPropagation();
			const { from } = drag;
			say(cancelled, items);
			end();
			flushSync();
			focusHandle(from);
			return;
		}

		if (event.key === 'Tab') {
			commit();
			return;
		}

		const to = keyTarget(event.key, index, shown.length);
		if (to === null) return;
		event.preventDefault();

		reorderDraft(index, to);
		// Moving the row moved its handle in the DOM, and a moved element loses focus.
		focusHandle(to);
		say(moved, draft ?? items);
	}

	function handleBlur() {
		// A keyboard drag left behind by a click elsewhere is dropped where it is, not silently kept.
		if (moving || drag?.mode !== 'keyboard') return;
		commit();
	}

	function handleFor(entry: T, index: number): HandleProps {
		const label = getLabel(entry);
		return {
			'data-coral-handle': index,
			role: 'button',
			tabindex: disabled ? -1 : 0,
			'aria-label': handleLabel(label),
			'aria-describedby': `${uid}-instructions`,
			'aria-pressed': drag?.mode === 'keyboard' && drag.key === getKey(entry),
			'aria-disabled': disabled ? 'true' : undefined,
			onpointerdown: (event: PointerEvent) => handlePointerDown(event, index),
			onkeydown: (event: KeyboardEvent) => handleKeydown(event, index),
			onblur: handleBlur,
			// The page must not scroll or zoom under a finger that is dragging a row.
			style: 'touch-action: none'
		};
	}

	function contextFor(entry: T, index: number): ItemContext<T> {
		return {
			item: entry,
			index,
			dragging: drag !== null && drag.key === getKey(entry),
			handle: handleFor(entry, index)
		};
	}
</script>

<!--
	`role="list"` is restated because Safari drops list semantics from a `<ul>` with its bullets
	removed, and the count - "list, 5 items" - is what orients someone about to reorder it.
-->
<ul
	bind:this={ref}
	role="list"
	data-dragging={drag ? drag.mode : undefined}
	class={cn('relative flex flex-col gap-2', className)}
	onpointermove={(event) => {
		handlePointerMove(event);
		onpointermove?.(event);
	}}
	onpointerup={(event) => {
		handlePointerUp(event);
		onpointerup?.(event);
	}}
	onpointercancel={(event) => {
		handlePointerCancel(event);
		onpointercancel?.(event);
	}}
	onlostpointercapture={(event) => {
		handlePointerCancel(event);
		onlostpointercapture?.(event);
	}}
	{...restProps}
>
	{#each shown as entry, index (getKey(entry))}
		{@const context = contextFor(entry, index)}
		<!--
			The row under the pointer skips the flip - it is already drawn where the pointer is, and
			animating it from its old slot would drag it away from the finger. Everything else slides
			out of its way, unless the reader asked for reduced motion.
		-->
		<li
			data-coral-row
			data-dragging={context.dragging || undefined}
			class={cn(
				'relative flex items-center gap-2',
				context.dragging && drag?.mode === 'pointer' && 'z-10 translate-y-(--coral-offset)',
				itemClass
			)}
			style:--coral-offset={context.dragging && drag?.mode === 'pointer'
				? `${offset}px`
				: undefined}
			animate:flip={{
				duration:
					prefersReducedMotion.current || (context.dragging && drag?.mode === 'pointer') ? 0 : 150
			}}
		>
			{#if rowSnippet}
				{@render rowSnippet(context)}
			{:else}
				<span
					{...context.handle}
					class={cn(
						'flex shrink-0 cursor-grab items-center',
						focusRing,
						context.dragging && 'cursor-grabbing',
						disabled && 'cursor-not-allowed opacity-50'
					)}
				>
					<GripVerticalIcon class="size-4" aria-hidden="true" />
				</span>
				{#if itemSnippet}
					{@render itemSnippet(context)}
				{:else}
					<span class="min-w-0 flex-1 truncate">{getLabel(entry)}</span>
				{/if}
			{/if}
		</li>
	{/each}
</ul>

<span id="{uid}-instructions" class="sr-only">{instructions}</span>

<!-- Assertive: a row moving under the reader's hands is happening now, not a result to read later. -->
<LiveRegion message={announcer.message} assertive />
