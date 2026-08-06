<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	type NavItem = {
		title: string;
		// Not Pathname: nav items may point at routes this starter doesn't ship
		// yet. See lib/config/domain/navigation.ts.
		url: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon: any;
	};

	let {
		items,
		class: className
	}: {
		items: NavItem[];
		class?: string;
	} = $props();

	function isActive(url: string): boolean {
		const pathname = page.url.pathname;
		if (url === '/') return pathname === '/';
		return pathname === url || pathname.startsWith(url + '/');
	}
</script>

<Sidebar.Group class={className}>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each items as item (item.url)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={isActive(item.url)} tooltipContent={item.title}>
						{#snippet child({ props })}
							<a
								href={resolve(item.url as Pathname)}
								{...props}
								aria-current={isActive(item.url) ? 'page' : undefined}
							>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
