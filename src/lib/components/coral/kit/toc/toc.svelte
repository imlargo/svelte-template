<script lang="ts">
	/**
	 * @coral/kit/toc
	 * @version 1.0.0
	 */
	import { prefersReducedMotion } from 'svelte/motion';
	import { cn } from '$lib/utils.js';
	import { collect, pickActive } from './headings.js';
	import type { TocHeading } from './headings.js';
	import type { TocItemContext, TocProps } from './types.js';

	let {
		headings,
		container = null,
		selector = 'h2, h3',
		root = null,
		offset = 80,
		active = $bindable(''),
		onactivechange,
		smooth = true,
		minHeadings = 2,
		label = 'On this page',
		ref = $bindable(null),
		class: className,
		itemClass,
		heading: headingSnippet,
		item,
		...restProps
	}: TocProps = $props();

	let collected = $state<TocHeading[]>([]);
	const entries = $derived(headings ?? collected);

	/** The shallowest level present, so an article of `h3`s is not indented as if it were nested. */
	const top = $derived(entries.length === 0 ? 2 : Math.min(...entries.map((entry) => entry.level)));

	// Read from the rendered article whenever the caller does not pass a list of its own.
	$effect(() => {
		if (headings) return;
		collected = collect(container ?? document.body, selector, document);
	});

	/**
	 * The heading a click asked for, held until the scroll it started has settled.
	 *
	 * Without this the highlight jumps: the click sets the section, and the very next measured frame
	 * - taken while the smooth scroll is still crossing everything in between - overrules it with
	 * whatever is passing the boundary at that instant. `scrollend` is the exact signal for "it has
	 * arrived", with a timeout behind it for the engines that do not fire it.
	 */
	let pinned: string | null = null;
	let unpin: ReturnType<typeof setTimeout> | undefined;

	/**
	 * The heading to focus once that scroll lands.
	 *
	 * Focusing it right away is what the obvious version does, and in Chromium the focus call
	 * cancels the smooth scroll it was meant to follow - leaving the reader short of the section
	 * they asked for, every time.
	 */
	let focusAfterScroll: HTMLElement | null = null;

	/**
	 * Moves focus into the section, which is the part a smooth-scrolling anchor otherwise loses:
	 * after `preventDefault` the browser no longer moves the caret, so a keyboard reader stays at the
	 * top of the page and the next Tab starts over. `tabindex="-1"` makes a heading focusable without
	 * adding a tab stop, and is dropped again when focus leaves it.
	 */
	function focusHeading(node: HTMLElement) {
		node.setAttribute('tabindex', '-1');
		node.focus({ preventScroll: true });
		node.addEventListener('blur', () => node.removeAttribute('tabindex'), { once: true });
	}

	function setActive(id: string) {
		if (id === active) return;
		active = id;
		onactivechange?.(id);
	}

	/**
	 * Measured on scroll rather than watched with `IntersectionObserver`. What is wanted is "the last
	 * heading the reader has passed", which is a question about position; an observer answers "what
	 * is on screen", and turning one answer into the other is where the obvious build goes wrong.
	 * Reading a rect per heading on a frame is cheap at the scale a table of contents lives at -
	 * tens of entries, not thousands.
	 */
	$effect(() => {
		if (entries.length === 0) return;

		const box = root;
		const target: EventTarget = box ?? window;
		let frame = 0;

		const measure = () => {
			frame = 0;
			// A click owns the highlight until its scroll lands.
			if (pinned !== null) return;
			const nodes = entries.map((entry) => document.getElementById(entry.id));
			const origin = box ? box.getBoundingClientRect().top : 0;
			const tops = nodes.map((node) =>
				node ? node.getBoundingClientRect().top - origin : Number.POSITIVE_INFINITY
			);

			// Within a pixel of the end - fractional scroll heights on zoomed or scaled pages never
			// reach equality exactly.
			const atEnd = box
				? box.scrollTop + box.clientHeight >= box.scrollHeight - 1
				: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;

			const index = pickActive(tops, offset, atEnd);
			if (index !== -1) setActive(entries[index].id);
		};

		const schedule = () => {
			// One measurement per frame: scroll fires far more often than the page can paint.
			if (frame === 0) frame = requestAnimationFrame(measure);
		};

		const release = () => {
			pinned = null;
			if (focusAfterScroll) {
				focusHeading(focusAfterScroll);
				focusAfterScroll = null;
			}
			schedule();
		};

		measure();
		target.addEventListener('scroll', schedule, { passive: true });
		target.addEventListener('scrollend', release);
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(unpin);
			target.removeEventListener('scroll', schedule);
			target.removeEventListener('scrollend', release);
			window.removeEventListener('resize', schedule);
		};
	});

	function handleClick(event: MouseEvent, heading: TocHeading) {
		// Modified clicks are the reader asking for a new tab or a download; the browser owns those.
		if (
			event.defaultPrevented ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}

		const node = document.getElementById(heading.id);
		if (!node) return;

		if (!smooth || prefersReducedMotion.current) {
			// Left to the browser: it jumps, moves focus into the section, and writes the hash.
			return;
		}

		event.preventDefault();
		pinned = heading.id;
		focusAfterScroll = node;
		clearTimeout(unpin);
		// The fallback for browsers without `scrollend`, and for a click on the section already at the
		// top: that scrolls nothing, so no scroll event would ever arrive to release it.
		unpin = setTimeout(() => {
			pinned = null;
			if (focusAfterScroll) {
				focusHeading(focusAfterScroll);
				focusAfterScroll = null;
			}
		}, 700);

		node.scrollIntoView({ behavior: 'smooth', block: 'start' });

		// The hash is written without a jump, so the section can still be linked to and reloaded.
		history.replaceState(history.state, '', `#${heading.id}`);
		setActive(heading.id);
	}
</script>

{#if entries.length >= minHeadings}
	<nav
		bind:this={ref}
		aria-label={label}
		class={cn('flex flex-col gap-3 [--coral-toc-indent:--spacing(4)]', className)}
		{...restProps}
	>
		{#if headingSnippet}
			{@render headingSnippet()}
		{:else if label}
			<span class="text-xs font-medium text-muted-foreground">
				{label}
			</span>
		{/if}

		<ul class="flex flex-col border-s">
			{#each entries as heading (heading.id)}
				{@const isActive = heading.id === active}
				{@const depth = Math.max(0, heading.level - top)}
				{@const props = {
					href: `#${heading.id}`,
					// `location` rather than `page`: the section is where the reader is within this
					// document, not a different page in a set of them.
					'aria-current': isActive ? ('location' as const) : undefined,
					onclick: (event: MouseEvent) => handleClick(event, heading)
				}}
				<li>
					{#if item}
						{@render item({ heading, active: isActive, depth, props } satisfies TocItemContext)}
					{:else}
						<a
							{...props}
							style:--coral-pad="calc(var(--spacing) * 3 + var(--coral-toc-indent) * {depth})"
							class={cn(
								'-ms-px block border-s-2 border-transparent py-1 ps-(--coral-pad) text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current]:border-primary aria-[current]:font-medium aria-[current]:text-foreground',
								itemClass
							)}
						>
							{heading.text}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
{/if}
