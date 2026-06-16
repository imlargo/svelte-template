<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LayoutIcon from '@lucide/svelte/icons/layout-dashboard';
	import type { ComponentProps } from 'svelte';
	import type { User } from '$lib/types/auth/user';
	import {
		NAVIGATION_ITEMS,
		NAVIGATION_GROUP_LABELS,
		NavigationGroup,
		ROLE_LABELS
	} from '$lib/config';
	import { UserRole } from '$lib/types/auth/roles';
	import { hasAnyPermission } from '$lib/features/auth';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';

	const sidebar = Sidebar.useSidebar();

	let {
		user,
		...restProps
	}: {
		user: User | null;
	} & Omit<ComponentProps<typeof Sidebar.Root>, 'children'> = $props();

	let currentRole = $derived(user?.role ?? UserRole.MEMBER);

	let visibleItems = $derived(
		NAVIGATION_ITEMS.filter((item) => hasAnyPermission(currentRole, item.requiredPermissions))
	);

	let navMainGroups = $derived.by(() => {
		const mainItems = visibleItems
			.filter((item) => item.group === NavigationGroup.Main)
			.map((item) => ({ title: item.title, icon: item.icon, url: item.to }));

		const adminItems = visibleItems
			.filter((item) => item.group === NavigationGroup.Admin)
			.map((item) => ({ title: item.title, icon: item.icon, url: item.to }));

		return [
			{ label: NAVIGATION_GROUP_LABELS[NavigationGroup.Main], items: mainItems },
			{ label: NAVIGATION_GROUP_LABELS[NavigationGroup.Admin], items: adminItems }
		].filter((group) => group.items.length > 0);
	});

	let displayUser = $derived({
		name: user?.name ?? user?.email ?? 'User',
		email: user?.email ?? '',
		roleLabel: user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '',
		avatar: user?.avatar ?? null
	});

	// Close mobile sidebar on navigation
	let previousPathname = $state(page.url.pathname);
	$effect(() => {
		const nextPathname = page.url.pathname;
		if (nextPathname !== previousPathname) {
			previousPathname = nextPathname;
			if (sidebar.isMobile && sidebar.openMobile) {
				sidebar.setOpenMobile(false);
			}
		}
	});
</script>

<Sidebar.Root collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					size="lg"
					tooltipContent="Home"
					class="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0"
				>
					{#snippet child({ props })}
						<a href="/" {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<LayoutIcon class="size-4" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<!-- Replace "App" with your application name -->
								<span class="truncate font-semibold">App</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<NavMain groups={navMainGroups} />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={displayUser} />
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
