<script lang="ts">
	/**
	 * @coral/kit/segmented-progress
	 * @version 1.0.0
	 */
	import { cn } from '#lib/utils.js';
	import { numberFormat } from '../../lib/intl.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { rangeOf, stateOf } from './segments.js';
	import type { SegmentedProgressProps } from './types.js';

	const defaults = getCoralDefaults('kit/segmented-progress');

	let {
		count,
		value,
		type = 'progress',
		valueText = defaults.valueText,
		locale = defaults.locale ?? 'en-US',
		color = 'var(--primary)',
		emptyColor = 'var(--muted)',
		ref = $bindable(null),
		class: className,
		segmentClass,
		...restProps
	}: SegmentedProgressProps = $props();

	const range = $derived(rangeOf(count, value));
	const text = $derived.by(() => {
		if (valueText) return valueText(range.value, range.count, type);
		const number = numberFormat(locale);
		const of = `${number.format(range.value)} of ${number.format(range.count)}`;
		return type === 'progress' ? `Step ${of}` : of;
	});
</script>

<!--
	Progress through steps is a progressbar, a level is a meter: the role is what tells a screen
	reader whether it is hearing how far a task got or how much of something there is. A flex row,
	so a right-to-left page fills it from the right without being told.
-->
<div
	bind:this={ref}
	role={type === 'meter' ? 'meter' : 'progressbar'}
	aria-valuenow={range.value}
	aria-valuemin={0}
	aria-valuemax={range.count}
	aria-valuetext={text}
	style:--coral-color={color}
	style:--coral-empty={emptyColor}
	class={cn('flex h-1 w-full gap-1', className)}
	{...restProps}
>
	{#each { length: range.count }, index (index)}
		<!-- The current step grows rather than changing colour, so it is not told by colour alone. -->
		<div
			data-state={stateOf(index, range.value, type)}
			class={cn(
				'min-w-0 flex-1 rounded-full bg-(--coral-empty) motion-safe:transition-[flex-grow,background-color] motion-safe:duration-300',
				'data-[state=complete]:bg-(--coral-color) data-[state=current]:grow-2 data-[state=current]:bg-(--coral-color) data-[state=filled]:bg-(--coral-color)',
				segmentClass
			)}
		></div>
	{/each}
</div>
