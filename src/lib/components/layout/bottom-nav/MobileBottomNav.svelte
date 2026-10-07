<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { cn } from '#lib/utils.js';
	import { isPrefixOf } from '#lib/utils/paths.js';
	import { displayUser, visibleNavigationItems } from '#lib/components/layout/navigation.js';
	import type { User } from '#lib/types/user.js';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import MobileMoreSheet from './MobileMoreSheet.svelte';

	// Tabs beyond this many go to the "More" sheet, with the account and the theme.
	const PRIMARY_TABS = 4;

	let { user }: { user: User | null } = $props();

	let moreOpen = $state(false);

	const entries = $derived(
		visibleNavigationItems(user).map((item) => ({
			title: item.title,
			icon: item.icon,
			href: resolve(item.route)
		}))
	);
	const primary = $derived(entries.slice(0, PRIMARY_TABS));
	const overflow = $derived(entries.slice(PRIMARY_TABS));
	const overflowActive = $derived(
		overflow.some((entry) => isPrefixOf(entry.href, page.url.pathname))
	);

	const tabClass =
		'relative flex flex-1 basis-0 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[0.6875rem] leading-tight font-medium transition-colors select-none active:bg-accent';
</script>

<nav
	aria-label="Main"
	class="flex shrink-0 items-stretch border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
>
	{#each primary as entry (entry.href)}
		{@const active = isPrefixOf(entry.href, page.url.pathname)}
		<a
			href={entry.href}
			aria-current={active ? 'page' : undefined}
			class={cn(tabClass, 'min-h-14', active ? 'text-primary' : 'text-muted-foreground')}
		>
			{#if active}
				<span class="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" aria-hidden="true"
				></span>
			{/if}
			<entry.icon class="size-5 shrink-0" />
			<span class="w-full truncate text-center">{entry.title}</span>
		</a>
	{/each}

	<button
		type="button"
		onclick={() => (moreOpen = true)}
		aria-haspopup="dialog"
		aria-expanded={moreOpen}
		class={cn(tabClass, 'min-h-14', overflowActive ? 'text-primary' : 'text-muted-foreground')}
	>
		<EllipsisIcon class="size-5 shrink-0" />
		<span class="w-full truncate text-center">More</span>
	</button>
</nav>

<MobileMoreSheet bind:open={moreOpen} items={overflow} user={displayUser(user)} />
