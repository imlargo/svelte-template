<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { NAVIGATION_ITEMS } from '$lib/config/domain';

	// Derive page title from NAVIGATION_ITEMS by matching the current pathname.
	// Longer routes are checked first so /admin/users matches "Admin" not a shallower route.
	const sortedItems = [...NAVIGATION_ITEMS].sort((a, b) => b.to.length - a.to.length);

	let pageTitle = $derived.by(() => {
		const pathname = page.url.pathname;
		const match = sortedItems.find(
			(item) =>
				(item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(item.to + '/'))
		);
		return match?.title ?? 'App';
	});
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
