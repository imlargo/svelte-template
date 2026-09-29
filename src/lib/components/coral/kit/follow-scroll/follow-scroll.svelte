<script lang="ts">
	/**
	 * @coral/kit/follow-scroll
	 * @version 1.0.0
	 */
	import { prefersReducedMotion } from 'svelte/motion';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { isAtEnd, unreadSince } from './follow.js';
	import type { FollowScrollProps } from './types.js';

	let {
		pinned = $bindable(true),
		onpinnedchange,
		count,
		threshold = 32,
		jumpLabel = 'Jump to latest',
		unreadLabel = (unread: number) => `${unread} new`,
		ref = $bindable(null),
		class: className,
		children,
		jump,
		...restProps
	}: FollowScrollProps = $props();

	let content = $state<HTMLDivElement | null>(null);

	/**
	 * What had arrived when the reader scrolled away, so what came after it can be counted. Without
	 * a `count` there is nothing to count, and `grew` carries the same news as a plain yes or no.
	 */
	let mark = $state(0);
	let grew = $state(false);

	const unread = $derived(count === undefined || pinned ? 0 : unreadSince(count, mark));
	const behind = $derived(!pinned && (unread > 0 || grew));

	function viewportOf(node: HTMLDivElement) {
		return {
			scrollTop: node.scrollTop,
			clientHeight: node.clientHeight,
			scrollHeight: node.scrollHeight
		};
	}

	function setPinned(next: boolean) {
		if (next === pinned) return;

		pinned = next;
		if (next) {
			grew = false;
		} else {
			// The mark is taken as following stops, which is what makes "12 new" mean twelve since
			// the reader looked away rather than twelve in total.
			mark = count ?? 0;
		}
		onpinnedchange?.(next);
	}

	function toEnd(smooth = false) {
		if (!ref) return;
		ref.scrollTo({
			top: ref.scrollHeight,
			behavior: smooth && !prefersReducedMotion.current ? 'smooth' : 'instant'
		});
	}

	/** Goes back to the end and starts following again. */
	function scrollToEnd() {
		setPinned(true);
		grew = false;
		toEnd(true);
	}

	/**
	 * New content arriving. The view is kept at the end only while the reader is already there -
	 * which is the whole point: a log that yanks the page down while someone is reading further up
	 * is a log nobody can read.
	 */
	$effect(() => {
		if (!content) return;

		const observer = new ResizeObserver(() => {
			if (pinned) toEnd();
			else grew = true;
		});
		observer.observe(content);
		return () => observer.disconnect();
	});

	/**
	 * `pinned` read as an instruction, not just a flag: turned on from outside - on mount, by a
	 * "follow" toggle, after a filter is cleared - it means go to the end and stay there. Starting
	 * it at `false` is what starts a view at the top instead.
	 */
	$effect(() => {
		if (!pinned || !ref) return;
		if (!isAtEnd(viewportOf(ref), threshold)) toEnd();
	});

	function handleScroll(event: Event & { currentTarget: HTMLDivElement }) {
		setPinned(isAtEnd(viewportOf(event.currentTarget), threshold));
	}
</script>

<!--
	Two elements, and both are needed: the inner one scrolls, and the outer one is what the control
	is positioned against. Put the control inside the scroller and it scrolls away with the content
	it is offering to skip.
-->
<div class={cn('relative', className)}>
	<div
		bind:this={ref}
		class="h-full overflow-y-auto overscroll-contain"
		onscroll={handleScroll}
		{...restProps}
	>
		<div bind:this={content}>
			{@render children()}
		</div>
	</div>

	{#if behind}
		{@const context = { unread, behind, scrollToEnd }}
		{#if jump}
			{@render jump(context)}
		{:else}
			<div class="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
				<!--
					The count is part of the button's name rather than a badge beside it: "3 new, jump to
					latest" is one control saying one thing, and a badge would need a second label to say
					what the number counts.
				-->
				<Button
					variant="secondary"
					size="sm"
					class="pointer-events-auto shadow-xs"
					onclick={scrollToEnd}
				>
					<ArrowDownIcon data-icon="inline-start" />
					{unread > 0 ? `${unreadLabel(unread)} · ${jumpLabel}` : jumpLabel}
				</Button>
			</div>
		{/if}
	{/if}
</div>
