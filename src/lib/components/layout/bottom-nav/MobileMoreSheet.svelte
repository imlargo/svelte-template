<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { userPrefersMode } from 'mode-watcher';
	import { cn } from '#lib/utils.js';
	import { isPrefixOf, resolvePathname } from '#lib/utils/paths.js';
	import { AUTH_ROUTES } from '#lib/config/routes.js';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import Avatar from '#lib/components/coral/kit/avatar/avatar.svelte';
	import {
		selectTheme,
		THEME_OPTIONS,
		type DisplayUser
	} from '#lib/components/layout/navigation.js';
	import type { LucideIcon } from '@lucide/svelte';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		open = $bindable(false),
		items,
		user
	}: {
		open?: boolean;
		items: { title: string; icon: LucideIcon; href: string }[];
		user: DisplayUser;
	} = $props();

	afterNavigate(() => (open = false));
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		class="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-xl p-0 pb-[env(safe-area-inset-bottom)]"
	>
		<Sheet.Header class="border-b px-4 py-4">
			<Sheet.Title class="sr-only">Menu</Sheet.Title>
			<Sheet.Description class="sr-only">More sections and your account.</Sheet.Description>
			<div class="flex items-center gap-3 pe-8">
				<Avatar src={user.avatar ?? undefined} name={user.name} />
				<div class="grid min-w-0 flex-1 text-start leading-tight">
					<span class="truncate text-sm font-medium">{user.name}</span>
					<span class="truncate text-xs text-muted-foreground">{user.roleLabel}</span>
				</div>
			</div>
		</Sheet.Header>

		{#if items.length > 0}
			<nav aria-label="More sections" class="flex flex-col border-b p-2">
				{#each items as entry (entry.href)}
					{@const active = isPrefixOf(entry.href, page.url.pathname)}
					<a
						href={entry.href}
						aria-current={active ? 'page' : undefined}
						class={cn(
							'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm',
							active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
						)}
					>
						<entry.icon class="size-4 text-muted-foreground" />
						{entry.title}
					</a>
				{/each}
			</nav>
		{/if}

		<div class="flex flex-col gap-2 border-b p-4">
			<p class="text-xs font-medium text-muted-foreground">Theme</p>
			<div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
				{#each THEME_OPTIONS as option (option.value)}
					{@const selected = userPrefersMode.current === option.value}
					<Button
						variant={selected ? 'secondary' : 'outline'}
						role="radio"
						aria-checked={selected}
						onclick={() => selectTheme(option.value)}
					>
						<option.icon class="size-4" />
						{option.label}
					</Button>
				{/each}
			</div>
		</div>

		<form method="POST" action={resolvePathname(AUTH_ROUTES.logout)} use:enhance class="p-2">
			<Button type="submit" variant="ghost" class="w-full justify-start">
				<LogOutIcon class="size-4" />
				Sign out
			</Button>
		</form>
	</Sheet.Content>
</Sheet.Root>
