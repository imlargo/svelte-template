<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { AUTH_ROUTES } from '#lib/config/routes.js';
	import Avatar from '#lib/components/coral/kit/avatar/avatar.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import { toggleMode, mode } from 'mode-watcher';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	let {
		user
	}: {
		user: { name: string; email: string; roleLabel: string; avatar?: string | null };
	} = $props();

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props }: { props: Record<string, unknown> })}
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
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						<Avatar src={user.avatar ?? undefined} name={user.name} />
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs text-muted-foreground">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={toggleMode}>
					{#if mode.current === 'dark'}
						<SunIcon class="size-4" />
						Light mode
					{:else}
						<MoonIcon class="size-4" />
						Dark mode
					{/if}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<!-- A POST, so link prefetching can never sign the user out on its own. -->
				<form method="POST" action={resolve(AUTH_ROUTES.logout)} use:enhance>
					<DropdownMenu.Item>
						{#snippet child({ props }: { props: Record<string, unknown> })}
							<button type="submit" class="w-full" {...props}>
								<LogOutIcon />
								Sign out
							</button>
						{/snippet}
					</DropdownMenu.Item>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
