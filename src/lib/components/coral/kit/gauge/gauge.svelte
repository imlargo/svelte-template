<script lang="ts">
	/**
	 * @coral/kit/gauge
	 * @version 1.0.0
	 */
	import { cn } from '#lib/utils.js';
	import { numberFormat } from '../../lib/intl.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { arcFor, fractionOf } from './arc.js';
	import { readingText } from './reading.js';
	import type { GaugeProps } from './types.js';

	const defaults = getCoralDefaults();

	let {
		value,
		min = 0,
		max = 100,
		sweep = 270,
		thickness = 10,
		locale = defaults.locale ?? 'en-US',
		format,
		color = 'var(--primary)',
		emptyColor = 'var(--muted)',
		ref = $bindable(null),
		class: className,
		contentClass,
		children,
		...restProps
	}: GaugeProps = $props();

	const arc = $derived(arcFor(sweep, thickness));
	const fraction = $derived(fractionOf(value, min, max));
	/** ARIA wants the number inside the range; the text, which a reader actually hears, stays true. */
	const now = $derived(Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min);
	const text = $derived(readingText(numberFormat(locale, format), value, min, max));

	const box = $derived(arc.viewBox);
	const viewBox = $derived(`${box.x} ${box.y} ${box.width} ${box.height}`);

	/** The middle's box, as fractions of the drawing, so it scales with it rather than in pixels. */
	const inner = $derived({
		left: `${((arc.inner.x - box.x) / box.width) * 100}%`,
		top: `${((arc.inner.y - box.y) / box.height) * 100}%`,
		width: `${(arc.inner.width / box.width) * 100}%`,
		height: `${(arc.inner.height / box.height) * 100}%`
	});
</script>

<!--
	A meter, not a progressbar: a progressbar is a task moving towards done, and a gauge is a reading
	inside a known range - disk used, a score, a quota. The text a screen reader hears is the one the
	middle shows, so a percent or a unit is spoken as written rather than as a bare number.
-->
<div
	bind:this={ref}
	role="meter"
	aria-valuenow={now}
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuetext={text}
	style:--coral-color={color}
	style:--coral-empty={emptyColor}
	class={cn('relative w-(--coral-gauge) shrink-0 [--coral-gauge:--spacing(32)]', className)}
	{...restProps}
>
	<!-- Mirrored in a right-to-left page, so the arc fills the way that reader's eye travels. -->
	<svg {viewBox} class="block h-auto w-full rtl:-scale-x-100" aria-hidden="true">
		<path
			d={arc.path}
			fill="none"
			stroke="var(--coral-empty)"
			stroke-width={thickness}
			stroke-linecap="round"
		/>
		<!--
			The value is the track's own path, dashed to its length: `pathLength` makes the whole path
			100 long whatever its shape, so the dash is the percentage. Left out at zero, because a
			round cap on a zero-length dash still draws a dot.
		-->
		{#if fraction > 0}
			<path
				d={arc.path}
				fill="none"
				stroke="var(--coral-color)"
				stroke-width={thickness}
				stroke-linecap="round"
				pathLength="100"
				stroke-dasharray="{fraction * 100} 100"
				class="motion-safe:transition-[stroke-dasharray] motion-safe:duration-500"
			/>
		{/if}
	</svg>

	<div
		class={cn(
			'absolute top-(--coral-top) left-(--coral-left) flex h-(--coral-height) w-(--coral-width) items-center justify-center text-center',
			contentClass
		)}
		style:--coral-left={inner.left}
		style:--coral-top={inner.top}
		style:--coral-width={inner.width}
		style:--coral-height={inner.height}
		aria-hidden="true"
	>
		{#if children}
			{@render children({ value, fraction, text })}
		{:else}
			<span class="text-2xl font-semibold tabular-nums">{text}</span>
		{/if}
	</div>
</div>
