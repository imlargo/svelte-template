<script lang="ts">
	/**
	 * @coral/kit/breadcrumbs
	 * @version 1.0.0
	 */
	import * as Breadcrumb from '#lib/components/ui/breadcrumb/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { cn } from '#lib/utils.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { focusRingTight } from '../../lib/focus.js';
	import { foldCount } from './fit.js';
	import type { Crumb, CrumbContext } from './types.js';
	import type { BreadcrumbsProps } from './types.js';

	const defaults = getCoralDefaults('kit/breadcrumbs');

	let {
		items,
		foldedLabel = defaults.foldedLabel ?? 'Show the folded pages',
		ref = $bindable(null),
		class: className,
		listClass,
		item: itemSnippet,
		separator,
		...restProps
	}: BreadcrumbsProps = $props();

	let measure = $state<HTMLOListElement | null>(null);

	/** How many crumbs after the first are folded into the menu. */
	let folded = $state(0);

	/**
	 * The whole trail is drawn twice: once invisible and unwrapped, to measure, and once as shown. The
	 * copy is measured rather than the real trail because the real one changes shape with the answer,
	 * and a measurement that changes what it measures never settles. It is re-read whenever the nav
	 * or the copy changes size - a resize, a longer label, a web font landing.
	 */
	$effect(() => {
		if (!ref || !measure) return;
		const nav = ref;
		const copy = measure;

		const width = (node: Element | null) => node?.getBoundingClientRect().width ?? 0;

		const fit = () => {
			const crumbs = Array.from(copy.querySelectorAll('[data-coral-crumb]'));
			folded = foldCount(
				{
					items: crumbs.map(width),
					// The real trail always has a separator once there are two crumbs; the gap beside it
					// is counted too, since the list lays its items out with one.
					separator:
						width(nav.querySelector('[data-slot="breadcrumb-separator"]')) + 2 * gapOf(copy),
					ellipsis: width(copy.querySelector('[data-coral-ellipsis]'))
				},
				nav.clientWidth
			);
		};

		const observer = new ResizeObserver(fit);
		observer.observe(nav);
		observer.observe(copy);
		fit();
		return () => observer.disconnect();
	});

	/** The list's own gap between items, read off the copy, which shares it. */
	const gapOf = (list: HTMLElement) => Number.parseFloat(getComputedStyle(list).columnGap) || 0;

	const hidden = $derived(items.slice(1, 1 + folded));
	const shown = $derived(items.slice(1 + folded));

	function contextFor(crumb: Crumb, index: number): CrumbContext {
		return { crumb, index, current: index === items.length - 1 };
	}
</script>

{#snippet crumbBody(crumb: Crumb, index: number)}
	{#if itemSnippet}
		{@render itemSnippet(contextFor(crumb, index))}
	{:else}
		{crumb.label}
	{/if}
{/snippet}

<!--
	The current page is a `Page`, which the primitive marks `aria-current="page"` and does not link:
	a crumb linking to the page it is on reads as a way out that leads nowhere. A long name is
	truncated with the full text in its title; the folded pages keep theirs in full inside the menu.
-->
{#snippet trailItem(entry: Crumb, index: number)}
	<Breadcrumb.Item class="min-w-0">
		{#if index === items.length - 1}
			<Breadcrumb.Page class="truncate" title={entry.label}>
				{@render crumbBody(entry, index)}
			</Breadcrumb.Page>
		{:else}
			<Breadcrumb.Link href={entry.href} class="truncate" title={entry.label}>
				{@render crumbBody(entry, index)}
			</Breadcrumb.Link>
		{/if}
	</Breadcrumb.Item>
{/snippet}

{#snippet divider()}
	<Breadcrumb.Separator>
		{#if separator}{@render separator()}{/if}
	</Breadcrumb.Separator>
{/snippet}

<Breadcrumb.Root bind:ref class={cn('relative', className)} {...restProps}>
	<Breadcrumb.List class={cn('flex-nowrap', listClass)}>
		{#if items.length > 0}
			{@render trailItem(items[0], 0)}
		{/if}

		{#if hidden.length > 0}
			{@render divider()}
			<Breadcrumb.Item>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn('flex items-center rounded-sm', focusRingTight)}
						aria-label={foldedLabel}
					>
						<Breadcrumb.Ellipsis />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="start">
						{#each hidden as entry, offset (offset)}
							<DropdownMenu.Item>
								{#snippet child({ props })}
									<a {...props} href={entry.href}>{@render crumbBody(entry, offset + 1)}</a>
								{/snippet}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Breadcrumb.Item>
		{/if}

		{#each shown as entry, offset (1 + folded + offset)}
			{@render divider()}
			{@render trailItem(entry, 1 + folded + offset)}
		{/each}
	</Breadcrumb.List>

	<!--
		The measuring copy: every crumb unwrapped, plus the fold control, out of sight and out of the
		accessibility tree. It shares the list's gap, so the widths it reports are the ones the trail
		would take.
	-->
	<ol
		bind:this={measure}
		aria-hidden="true"
		class="invisible absolute inset-x-0 top-0 flex items-center gap-1.5 whitespace-nowrap"
	>
		{#each items as entry, index (index)}
			<li data-coral-crumb class="inline-flex items-center gap-1">
				{@render crumbBody(entry, index)}
			</li>
		{/each}
		<li data-coral-ellipsis class="inline-flex items-center">
			<Breadcrumb.Ellipsis />
		</li>
	</ol>
</Breadcrumb.Root>
