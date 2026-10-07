<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { NavigationSection } from '#lib/config/navigation.js';
	import { isPrefixOf } from '#lib/utils/paths.js';

	let { sections }: { sections: NavigationSection[] } = $props();
</script>

{#each sections as section (section.label)}
	<Sidebar.Group>
		<Sidebar.GroupLabel>{section.label}</Sidebar.GroupLabel>
		<Sidebar.GroupContent>
			<Sidebar.Menu>
				{#each section.items as item (item.route)}
					{@const href = resolve(item.route)}
					{@const active = isPrefixOf(href, page.url.pathname)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={active} tooltipContent={item.title}>
							{#snippet child({ props })}
								<a {href} {...props} aria-current={active ? 'page' : undefined}>
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
