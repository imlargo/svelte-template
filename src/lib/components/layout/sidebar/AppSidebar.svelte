<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { resolvePathname } from '#lib/utils/paths.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { User } from '#lib/types/user.js';
	import { navigationSections, type NavigationSection } from '#lib/config/navigation.js';
	import { config } from '#lib/config/app.js';
	import { HOME_ROUTE } from '#lib/config/routes.js';
	import { ROLE_LABELS } from '#lib/config/permissions.js';
	import NavMain from './NavMain.svelte';
	import NavUser from './NavUser.svelte';

	let {
		user,
		sections: given,
		header,
		content,
		footer,
		menu,
		...restProps
	}: {
		user: User | null;
		/** Defaults to `navigationSections(user)`; pass them to add entries the config cannot know. */
		sections?: NavigationSection[];
		/** Replaces the brand link. */
		header?: Snippet;
		/** Between the navigation and the bottom groups: a banner, a card. */
		content?: Snippet;
		/** Above the account entry. */
		footer?: Snippet;
		/** Entries added to the account menu. */
		menu?: Snippet;
	} & Omit<ComponentProps<typeof Sidebar.Root>, 'children'> = $props();

	const sidebar = Sidebar.useSidebar();

	const sections = $derived(given ?? navigationSections(user));
	const main = $derived(sections.filter((section) => section.placement === 'main'));
	const bottom = $derived(sections.filter((section) => section.placement === 'bottom'));

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
		{#if header}
			{@render header()}
		{:else}
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
		{/if}
	</Sidebar.Header>

	<Sidebar.Content>
		<NavMain sections={main} />
		{#if content || bottom.length > 0}
			<div class="mt-auto">
				{@render content?.()}
				<NavMain sections={bottom} />
			</div>
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		{@render footer?.()}
		<NavUser user={displayUser} children={menu} />
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
