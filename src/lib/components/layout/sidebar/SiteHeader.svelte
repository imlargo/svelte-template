<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { config } from '#lib/config/app.js';
	import { NAVIGATION_ITEMS } from '#lib/config/navigation.js';
	import { activeHref, routeHref, withSearch } from '#lib/utils/paths.js';

	let {
		title,
		actions,
		trigger = true
	}: {
		/** Instead of the navigation entry the page belongs to. */
		title?: string;
		/** The right side: a search button, a bell, an account menu. */
		actions?: Snippet;
		/** Off on a surface that renders no sidebar. */
		trigger?: boolean;
	} = $props();

	const entries = NAVIGATION_ITEMS.flatMap((item) => [
		{ title: item.title, href: routeHref(item.route) },
		...(item.items ?? []).map((sub) => ({
			title: sub.title,
			href: withSearch(routeHref(sub.route), sub.search)
		}))
	]);
	// A sub-entry on its parent's own page (an "All" entry) does not rename it: the first entry wins.
	const hrefs = entries.map((entry) => entry.href);

	const section = $derived.by(() => {
		const active = activeHref(hrefs, page.url);
		return entries.find((entry) => entry.href === active)?.title ?? config.branding.name;
	});
</script>

<!-- The section, not the page's heading: each page renders its own <h1>. -->
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		{#if trigger}
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		{/if}
		<p class="text-base font-medium">{title ?? section}</p>
		{#if actions}
			<div class="ms-auto flex items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
</header>
