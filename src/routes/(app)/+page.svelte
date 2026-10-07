<script lang="ts">
	import PageHeader from '#lib/components/blocks/PageHeader.svelte';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
	import AsyncView from '#lib/components/blocks/AsyncView.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import type { LucideIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Explicit, like `formatDate`: the runtime's default locale is not the page's.
	const numbers = new Intl.NumberFormat('en');
</script>

<DocumentTitle title="Dashboard" />

<div class="flex flex-col gap-6">
	<PageHeader title="Dashboard" description="Welcome to your app. Start building here." />

	<!-- Streamed from `load`: the page is already here while these resolve. -->
	<AsyncView source={data.stats}>
		{#snippet loading()}
			<section class="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Loading stats">
				{#each { length: 3 }, i (i)}
					<Card.Root>
						<Card.Header class="pb-2">
							<Skeleton class="h-4 w-24" />
						</Card.Header>
						<Card.Content class="flex flex-col gap-2">
							<Skeleton class="h-7 w-16" />
							<Skeleton class="h-3 w-32" />
						</Card.Content>
					</Card.Root>
				{/each}
			</section>
		{/snippet}

		{#snippet children(stats)}
			<section class="grid gap-4 sm:grid-cols-3">
				{@render stat('Total users', stats.totalUsers, 'All registered accounts', UsersIcon)}
				{@render stat('Active sessions', stats.activeSessions, 'Currently online', ActivityIcon)}
				{@render stat('Events today', stats.eventsToday, 'Across all sources', LayoutDashboardIcon)}
			</section>
		{/snippet}
	</AsyncView>
</div>

{#snippet stat(title: string, value: number, hint: string, Icon: LucideIcon)}
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between pb-2">
			<Card.Title class="text-sm font-medium">{title}</Card.Title>
			<Icon class="size-4 text-muted-foreground" />
		</Card.Header>
		<Card.Content>
			<div class="text-2xl font-bold">{numbers.format(value)}</div>
			<p class="text-xs text-muted-foreground">{hint}</p>
		</Card.Content>
	</Card.Root>
{/snippet}
