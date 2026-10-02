<script lang="ts" generics="T = unknown">
	/**
	 * @coral/kit/activity-calendar
	 * @version 1.0.0
	 */
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';
	import { dateTimeFormat } from '../../lib/intl.js';
	import { focusRingTight } from '../../lib/focus.js';
	import { weekdayAt } from './dates.js';
	import { buildGrid, stepFor } from './grid.js';
	import type { ActivityCell } from './grid.js';
	import type { ActivityCalendarProps } from './types.js';

	let {
		data,
		start,
		end,
		weekStart = 1,
		levels = 4,
		thresholds,
		locale = 'en-US',
		color = 'var(--primary)',
		emptyColor = 'var(--muted)',
		showWeekdays = true,
		showMonths = true,
		showLegend = true,
		caption,
		label,
		onselect,
		ref = $bindable(null),
		class: className,
		cellClass,
		cell: cellSnippet,
		tooltip,
		legend,
		...restProps
	}: ActivityCalendarProps<T> = $props();

	const grid = $derived(buildGrid<T>(data, { start, end, weekStart, levels, thresholds }));

	/**
	 * How many steps the ramp has. Read off the grid, not `levels`, because `thresholds` overrides
	 * it: six cuts against a default `levels` would paint the top two levels the same colour.
	 */
	const steps = $derived(Math.max(grid.thresholds.length, 1));

	const dayFormat = $derived(
		dateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
	);
	const monthFormat = $derived(dateTimeFormat(locale, { month: 'short' }));
	const weekdayFormat = $derived(dateTimeFormat(locale, { weekday: 'long' }));
	const weekdayShortFormat = $derived(dateTimeFormat(locale, { weekday: 'short' }));

	/** The seven row headings, in the order the rows are drawn. */
	const weekdays = $derived(
		Array.from({ length: 7 }, (_, row) => {
			const date = weekdayAt(weekStart, row);
			return { long: weekdayFormat.format(date), short: weekdayShortFormat.format(date) };
		})
	);

	const labelFor = $derived(
		label ?? ((cell: ActivityCell<T>) => `${cell.count} · ${dayFormat.format(cell.date)}`)
	);

	/**
	 * The fill for each level, level 0 first. Coral picks no colour - both ends are theme tokens and
	 * what it defines is the distance between them, which is data, not appearance. `color-mix`
	 * keeps every step opaque; an `opacity` ramp would fade the focus ring with the square.
	 */
	const fills = $derived([
		emptyColor,
		...Array.from(
			{ length: steps },
			(_, step) =>
				`color-mix(in oklab, ${color} ${Math.round(((step + 1) / steps) * 100)}%, ${emptyColor})`
		)
	]);

	/** Clamped, because `ActivityDay.level` is the caller's number and need not fit the ramp. */
	const colorFor = $derived((level: number) => fills[Math.max(0, Math.min(level, steps))]);

	let frame = $state<HTMLDivElement | null>(null);

	const byKey = $derived(new Map(grid.cells.map((cell) => [cell.key, cell])));

	/**
	 * Which square Tab reaches: one tab stop for the whole grid, arrows to move inside it, against
	 * an alternative of 365. A key rather than an index, so it survives the data changing.
	 */
	let focusKey = $state<string | null>(null);
	const tabbable = $derived((focusKey && byKey.get(focusKey)) || grid.cells[0]);

	type Live = {
		cell: ActivityCell<T>;
		box: { left: number; top: number; width: number; height: number };
	};

	/**
	 * Hover and focus tracked apart, hover winning where both are live. One `active` for the two
	 * reads simpler and is wrong: moving the mouse off would close the tooltip the keyboard is on.
	 */
	let hovered = $state<Live | null>(null);
	let focused = $state<Live | null>(null);
	const live = $derived(hovered ?? focused);

	/**
	 * Where a square sits inside the scroller, so the anchor can be parked on it. Measured, not read
	 * off `offsetLeft`: `offsetParent` stops at the nearest `td`, `th` or `table`, so inside a table
	 * every square reports roughly zero and the tooltip lands in the corner. Scroll offsets go back
	 * in because the anchor is positioned inside the scroller and travels with its content.
	 */
	function locate(cell: ActivityCell<T>, element: HTMLElement): Live | null {
		if (!frame) return null;
		const square = element.getBoundingClientRect();
		const around = frame.getBoundingClientRect();
		const left = square.left - around.left + frame.scrollLeft;
		const top = square.top - around.top + frame.scrollTop;
		return { cell, box: { left, top, width: square.width, height: square.height } };
	}

	/**
	 * Focus moving between two squares fires a leave before the next enter. Closing on that leave
	 * would shut the tooltip on every arrow key, so a focus that stayed inside the grid is ignored.
	 */
	function blur(event: FocusEvent & { currentTarget: HTMLTableElement }) {
		const next = event.relatedTarget;
		if (next instanceof Node && event.currentTarget.contains(next)) return;
		focused = null;
	}

	function move(event: KeyboardEvent & { currentTarget: HTMLElement }) {
		if (!tabbable) return;

		// Read off the element, like every other component here that has a left and a right.
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		const step = stepFor(event.key, rtl);

		let to: number;
		if (step !== undefined) to = tabbable.index + step;
		else if (event.key === 'Home') to = 0;
		else if (event.key === 'End') to = grid.cells.length - 1;
		else return;

		event.preventDefault();
		// Clamped rather than wrapped: the ends of a calendar are ends, and a wrap would jump a
		// year with no way to tell it apart from a step.
		const target = grid.cells[Math.max(0, Math.min(grid.cells.length - 1, to))];
		focusKey = target.key;
		frame?.querySelector<HTMLButtonElement>(`[data-day="${target.key}"]`)?.focus();
	}
</script>

<!--
	Two knobs, as custom properties rather than props: a grid is sized, not styled, and every size
	in it derives from the square. Override them through `class` - `[--coral-cell:--spacing(4)]`.
-->
<div
	bind:this={ref}
	class={cn(
		'flex w-full flex-col gap-3 [--coral-cell:--spacing(3)] [--coral-gap:--spacing(0.75)]',
		className
	)}
	{...restProps}
>
	<Tooltip.Provider delayDuration={0} disableHoverableContent>
		<Tooltip.Root
			open={live !== null}
			onOpenChange={(open) => {
				if (open) return;
				hovered = null;
				focused = null;
			}}
		>
			<div bind:this={frame} class="relative overflow-x-auto">
				<!--
					One tooltip for the whole grid, anchored to an empty box parked over whichever
					square is live. A `Tooltip.Root` per square is the obvious build and it means ~365
					floating-ui instances mounted to show one of them; this is a single instance and a
					`left/top` write. The box takes no pointer events, so the tooltip opens and closes
					on the squares' own events, never on its own.
				-->
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<span
							{...{ ...props, tabindex: -1 }}
							aria-hidden="true"
							class="pointer-events-none absolute top-(--coral-top) left-(--coral-left) h-(--coral-height) w-(--coral-width)"
							style:--coral-left="{live?.box.left ?? 0}px"
							style:--coral-top="{live?.box.top ?? 0}px"
							style:--coral-width="{live?.box.width ?? 0}px"
							style:--coral-height="{live?.box.height ?? 0}px"
						></span>
					{/snippet}
				</Tooltip.Trigger>

				<table
					class="border-separate border-spacing-(--coral-gap)"
					onpointerleave={() => (hovered = null)}
					onfocusout={blur}
				>
					{#if caption}
						<caption class="sr-only">{caption}</caption>
					{/if}

					{#if showMonths}
						<thead>
							<tr>
								{#if showWeekdays}
									<td class="p-0"></td>
								{/if}
								{#each grid.months as month (month.key)}
									<!-- A one-column run has no room for a name; the run it belongs to is
									     still spanned so the header stays in step with the body. -->
									<th
										colspan={month.span}
										scope="col"
										class="pb-1 text-start text-xs font-normal whitespace-nowrap text-muted-foreground"
									>
										{month.span > 1 ? monthFormat.format(month.date) : ''}
									</th>
								{/each}
							</tr>
						</thead>
					{/if}

					<tbody>
						{#each weekdays as weekday, row (row)}
							<tr>
								{#if showWeekdays}
									<!-- `leading-none` so the label cannot make its row taller than a square,
									     which would space the grid unevenly every other row. -->
									<th scope="row" class="pe-1 text-end align-middle leading-none font-normal">
										<!-- Every row names itself for a screen reader; only every other one
										     says it out loud, because seven labels at this size collide. -->
										<span class="sr-only">{weekday.long}</span>
										<span aria-hidden="true" class="text-xs leading-none text-muted-foreground">
											{row % 2 === 1 ? weekday.short : ''}
										</span>
									</th>
								{/if}

								{#each grid.weeks as week (week.key)}
									{@const cell = week.days[row]}
									<td class="p-0">
										{#if cell}
											<!--
												A button even with no `onselect`: it is what makes the square
												reachable, and a tooltip only a mouse can open is a tooltip half
												the readers never see. The `aria-label` carries the same text, so
												the value is readable without opening anything at all.
											-->
											<button
												type="button"
												data-day={cell.key}
												data-level={cell.level}
												tabindex={cell === tabbable ? 0 : -1}
												aria-label={labelFor(cell)}
												style:--coral-fill={colorFor(cell.level)}
												class={cn(
													'block size-(--coral-cell) rounded-sm bg-(--coral-fill)',
													focusRingTight,
													onselect ? 'cursor-pointer' : 'cursor-default',
													cellClass
												)}
												onpointerenter={(event) => (hovered = locate(cell, event.currentTarget))}
												onfocus={(event) => {
													focusKey = cell.key;
													focused = locate(cell, event.currentTarget);
												}}
												onclick={() => onselect?.(cell)}
												onkeydown={move}
											>
												{@render cellSnippet?.(cell)}
											</button>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if live}
				<Tooltip.Content>
					{#if tooltip}
						{@render tooltip(live.cell)}
					{:else}
						{labelFor(live.cell)}
					{/if}
				</Tooltip.Content>
			{/if}
		</Tooltip.Root>
	</Tooltip.Provider>

	{#if showLegend}
		{#if legend}
			{@render legend({ levels: steps, colorFor, thresholds: grid.thresholds, total: grid.total })}
		{:else}
			<!-- Swatches, no words: `Less`/`More` is copy, and the ramp reads without it. -->
			<div class="flex items-center gap-(--coral-gap) self-end" aria-hidden="true">
				{#each fills as fill, level (level)}
					<span
						class="block size-(--coral-cell) rounded-sm bg-(--coral-fill)"
						style:--coral-fill={fill}
					></span>
				{/each}
			</div>
		{/if}
	{/if}
</div>
