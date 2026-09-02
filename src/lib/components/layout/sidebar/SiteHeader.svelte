<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { NAVIGATION_ITEMS } from '$lib/config/navigation';
	import { isPrefixOf } from '$lib/core/permissions';

	// Page title from NAVIGATION_ITEMS. Longest route first, so /admin/users
	// resolves to "Admin" rather than to a shallower entry.
	const byDepth = [...NAVIGATION_ITEMS].sort((a, b) => b.to.length - a.to.length);

	let pageTitle = $derived(
		byDepth.find((item) => isPrefixOf(item.to, page.url.pathname))?.title ?? 'App'
	);
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">{pageTitle}</h1>
	</div>
</header>
