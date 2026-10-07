<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { Separator } from '#lib/components/ui/separator/index.js';
	import { config } from '#lib/config/app.js';
	import { NAVIGATION_ITEMS } from '#lib/config/navigation.js';
	import { isPrefixOf } from '#lib/utils/paths.js';

	// Deepest route first, so a nested page takes its closest entry's title.
	const byDepth = NAVIGATION_ITEMS.map((item) => ({
		title: item.title,
		href: resolve(item.route)
	})).sort((a, b) => b.href.length - a.href.length);

	const section = $derived(
		byDepth.find((item) => isPrefixOf(item.href, page.url.pathname))?.title ?? config.branding.name
	);
</script>

<!-- The section, not the page's heading: each page renders its own <h1>. -->
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<p class="text-base font-medium">{section}</p>
	</div>
</header>
