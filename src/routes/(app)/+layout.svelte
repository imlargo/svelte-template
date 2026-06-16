<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/layout/sidebar/app-sidebar.svelte';
	import SiteHeader from '$lib/components/layout/sidebar/site-header.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<Sidebar.Provider
	class="h-screen"
	style="--sidebar-width: calc(var(--spacing) * 64); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar user={data.user} variant="inset" />
	<Sidebar.Inset class="flex h-[calc(100%-1rem)] min-h-0 flex-col overflow-hidden">
		<SiteHeader />
		<div class="@container/main flex min-h-0 flex-1 flex-col overflow-auto">
			<div id="main-content" class="flex min-h-full flex-1 flex-col px-4 pt-4 pb-8 md:px-8 md:pt-6">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
