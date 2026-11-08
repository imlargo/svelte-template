<script module lang="ts">
	/** What the menu shows about the person signed in. */
	export interface MenuUser {
		name: string;
		email: string;
		roleLabel: string;
		avatar?: string | null;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolvePathname } from '#lib/utils/paths.js';
	import { AUTH_ROUTES } from '#lib/config/routes.js';
	import Avatar from '#lib/components/coral/kit/avatar/avatar.svelte';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { toggleMode, mode } from 'mode-watcher';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	// The account menu, wherever it opens from: the sidebar (NavUser) or a header
	// on a surface without one. The host supplies the trigger; the entries are the same.
	let {
		user,
		trigger,
		children,
		side = 'bottom',
		align = 'end'
	}: {
		user: MenuUser;
		/** The element that opens the menu, with the props to spread on it. */
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
		/** Entries between the account header and the theme toggle. */
		children?: Snippet;
		side?: 'top' | 'right' | 'bottom' | 'left';
		align?: 'start' | 'center' | 'end';
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
		{side}
		{align}
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
		{#if children}
			{@render children()}
			<DropdownMenu.Separator />
		{/if}
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
		<form method="POST" action={resolvePathname(AUTH_ROUTES.logout)} use:enhance>
			<DropdownMenu.Item>
				{#snippet child({ props })}
					<button type="submit" class="w-full" {...props}>
						<LogOutIcon />
						Sign out
					</button>
				{/snippet}
			</DropdownMenu.Item>
		</form>
	</DropdownMenu.Content>
</DropdownMenu.Root>
