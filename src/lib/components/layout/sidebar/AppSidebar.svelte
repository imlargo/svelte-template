<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolvePathname } from '#lib/utils/paths.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { User } from '#lib/types/user.js';
	import { config } from '#lib/config/app.js';
	import { HOME_ROUTE } from '#lib/config/routes.js';
	import { displayUser, navigationSections } from '#lib/components/layout/navigation.js';
	import NavMain from './NavMain.svelte';
	import NavUser from './NavUser.svelte';

	let {
		user,
		...restProps
	}: {
		user: User | null;
	} & Omit<ComponentProps<typeof Sidebar.Root>, 'children'> = $props();

	const sidebar = Sidebar.useSidebar();

	const sections = $derived(navigationSections(user));
	const shownUser = $derived(displayUser(user));

	afterNavigate(({ shallow }) => {
		if (shallow) return;
		if (sidebar.isMobile && sidebar.openMobile) sidebar.setOpenMobile(false);
	});
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					size="lg"
					tooltipContent="Home"
					class="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
				>
					{#snippet child({ props })}
						<a href={resolvePathname(HOME_ROUTE)} {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<img src={config.branding.logo} alt="" class="size-4" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-semibold">{config.branding.name}</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<NavMain {sections} />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={shownUser} />
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
