<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import AppSidebar from '#lib/components/layout/sidebar/AppSidebar.svelte';
	import SiteHeader from '#lib/components/layout/sidebar/SiteHeader.svelte';
	import Boundary from '#lib/components/blocks/Boundary.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
>
	Skip to main content
</a>

<Sidebar.Provider
	class="h-screen"
	style="--sidebar-width: calc(var(--spacing) * 64); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar user={data.user} variant="inset" />
	<Sidebar.Inset class="flex h-[calc(100%-1rem)] min-h-0 flex-col overflow-hidden">
		<SiteHeader />
		<div class="@container/main flex min-h-0 flex-1 flex-col overflow-auto">
			<div id="main-content" class="flex min-h-full flex-1 flex-col px-4 pt-4 pb-8 md:px-8 md:pt-6">
				<!-- `+error.svelte` catches what `load` throws; this catches what a page
				     throws while rendering, so the shell and the way out of it stay. -->
				<Boundary>
					{@render children()}
				</Boundary>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
