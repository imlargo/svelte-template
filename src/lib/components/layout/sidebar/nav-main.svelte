<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	type NavItem = {
		title: string;
		url: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon: any;
	};

	type NavGroup = {
		label: string;
		items: NavItem[];
	};

	let { groups }: { groups: NavGroup[] } = $props();

	function isActive(url: string): boolean {
		const pathname = page.url.pathname;
		if (url === '/') return pathname === '/';
		return pathname === url || pathname.startsWith(url + '/');
	}
</script>

{#each groups as group (group.label)}
	<Sidebar.Group>
		<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				{#each group.items as item (item.url)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={isActive(item.url)} tooltipContent={item.title}>
							{#snippet child({ props })}
								<a
									href={item.url}
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
{/each}
