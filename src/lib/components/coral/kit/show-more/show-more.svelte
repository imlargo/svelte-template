<script lang="ts">
	/**
	 * @coral/kit/show-more
	 * @version 1.0.0
	 */
	import { tick } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import type { ShowMoreProps } from './types.js';

	let {
		lines = 3,
		expanded = $bindable(false),
		onexpandedchange,
		moreLabel = 'Show more',
		lessLabel = 'Show less',
		ref = $bindable(null),
		class: className,
		contentClass,
		children,
		toggle: toggleSnippet,
		...restProps
	}: ShowMoreProps = $props();

	const uid = $props.id();
	const contentId = `${uid}-content`;

	let region = $state<HTMLDivElement | null>(null);
	let inner = $state<HTMLDivElement | null>(null);

	/**
	 * Whether there is anything to reveal. A "Show more" under a two-line review that already fits
	 * is a button that does nothing, which is what every clamp without a measurement ends up with.
	 */
	let overflowing = $state(false);

	/**
	 * Measured rather than guessed from character counts - fonts, widths and markup all change where
	 * a line breaks. The inner box is observed too, because while clamped the outer box keeps its
	 * height when the content grows, and only the inner one reports the change.
	 */
	$effect(() => {
		if (!region || !inner) return;
		const outer = region;

		const measure = () => {
			if (expanded) return;
			// One pixel of slack: sub-pixel line heights round differently in the two measurements.
			overflowing = outer.scrollHeight > outer.clientHeight + 1;
		};

		const observer = new ResizeObserver(measure);
		observer.observe(outer);
		observer.observe(inner);
		measure();
		return () => observer.disconnect();
	});

	async function setExpanded(next: boolean) {
		if (next === expanded) return;
		expanded = next;
		onexpandedchange?.(next);

		if (next || !ref) return;
		// Collapsing a long block leaves the reader scrolled far past where it now ends. Bringing the
		// top back into view keeps them next to the text they were reading and the button they used.
		await tick();
		if (ref.getBoundingClientRect().top < 0) ref.scrollIntoView({ block: 'nearest' });
	}

	const toggle = () => setExpanded(!expanded);

	/**
	 * A link or a button inside the clipped part is still in the tab order, and focusing one moves
	 * focus onto something the reader cannot see. Expanding when focus lands there means the keyboard
	 * never ends up somewhere invisible.
	 */
	function handleFocusIn(event: FocusEvent) {
		if (expanded || !overflowing || !region || !inner) return;

		// Measured from the top of the content, not against the clipped box: by the time this runs
		// the browser has usually scrolled the region to bring the focused element into view, and an
		// element that was hidden then looks exactly like one that is showing.
		const target = event.target as HTMLElement;
		const reach = target.getBoundingClientRect().bottom - inner.getBoundingClientRect().top;
		if (reach > region.clientHeight + 1) setExpanded(true);
	}

	const toggleProps = $derived({
		type: 'button' as const,
		'aria-expanded': expanded,
		'aria-controls': contentId,
		onclick: toggle
	});
</script>

<div bind:this={ref} class={cn('flex flex-col items-start gap-1', className)} {...restProps}>
	<!--
		Clipped by height in `lh` - the content's own line height - rather than `-webkit-line-clamp`.
		Line clamping only counts lines in a single run of inline text; a paragraph followed by a list
		is clamped unpredictably or not at all. A height cut works for any markup, at the price of
		possibly slicing an image in half, which is the right trade for text.
	-->
	<div
		bind:this={region}
		id={contentId}
		class={cn('w-full overflow-hidden', !expanded && 'max-h-(--coral-clamp)', contentClass)}
		style:--coral-clamp={expanded ? undefined : `calc(${lines} * 1lh)`}
		onfocusin={handleFocusIn}
	>
		<div bind:this={inner}>
			{@render children()}
		</div>
	</div>

	{#if overflowing || expanded}
		{#if toggleSnippet}
			{@render toggleSnippet({ props: toggleProps, expanded, toggle })}
		{:else}
			<!-- A link, so it lines up with the text above. -->
			<Button {...toggleProps} variant="link" class="h-auto px-0">
				{expanded ? lessLabel : moreLabel}
			</Button>
		{/if}
	{/if}
</div>
