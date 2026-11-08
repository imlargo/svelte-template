<script lang="ts">
	import type { Snippet } from 'svelte';
	import Avatar from '#lib/components/coral/kit/avatar/avatar.svelte';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import UserMenu, { type MenuUser } from './UserMenu.svelte';

	let {
		user,
		children
	}: {
		user: MenuUser;
		/** Entries added to the account menu. */
		children?: Snippet;
	} = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<UserMenu {user} side={sidebar.isMobile ? 'bottom' : 'right'} {children}>
			{#snippet trigger({ props })}
				<Sidebar.MenuButton
					{...props}
					size="lg"
					class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<Avatar src={user.avatar ?? undefined} name={user.name} />
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-medium">{user.name}</span>
						<span class="truncate text-xs text-muted-foreground">{user.roleLabel}</span>
					</div>
					<ChevronsUpDownIcon class="ms-auto size-4" />
				</Sidebar.MenuButton>
			{/snippet}
		</UserMenu>
	</Sidebar.MenuItem>
</Sidebar.Menu>
