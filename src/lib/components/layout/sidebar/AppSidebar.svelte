<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import type { User } from '#lib/types/user.js';
	import {
		NAVIGATION_GROUP_LABELS,
		NAVIGATION_ITEMS,
		NavigationGroup,
		type NavigationItem,
		type NavigationSection
	} from '#lib/config/navigation.js';
	import { config } from '#lib/config/app.js';
	import { HOME_ROUTE } from '#lib/config/routes.js';
	import {
		AUTH_ROUTE_PERMISSIONS,
		ROLE_LABELS,
		ROLE_PERMISSIONS
	} from '#lib/config/permissions.js';
	import { hasPermission, permissionForRoute } from '#lib/core/permissions.js';
	import NavMain from './NavMain.svelte';
	import NavUser from './NavUser.svelte';

	let {
		user,
		...restProps
	}: {
		user: User | null;
	} & Omit<ComponentProps<typeof Sidebar.Root>, 'children'> = $props();

	const sidebar = Sidebar.useSidebar();

	// Presentation only: the hook enforces the same table. With auth off there
	// is no role to check, so every item shows.
	function canOpen(item: NavigationItem): boolean {
		if (!config.auth.enabled) return true;
		const required = permissionForRoute(AUTH_ROUTE_PERMISSIONS, item.to);
		return required !== null && hasPermission(ROLE_PERMISSIONS, user?.role, required);
	}

	const sections: NavigationSection[] = $derived(
		Object.values(NavigationGroup)
			.map((group) => ({
				label: NAVIGATION_GROUP_LABELS[group],
				items: NAVIGATION_ITEMS.filter((item) => item.group === group && canOpen(item))
			}))
			.filter((section) => section.items.length > 0)
	);

	const displayUser = $derived({
		name: user?.name ?? user?.email ?? 'User',
		email: user?.email ?? '',
		roleLabel: user ? (ROLE_LABELS[user.role] ?? user.role) : '',
		avatar: user?.avatar ?? null
	});

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
						<a href={resolve(HOME_ROUTE)} {...props}>
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

	<Sidebar.Content><NavMain {sections} /></Sidebar.Content>
	<Sidebar.Footer><NavUser user={displayUser} /></Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
