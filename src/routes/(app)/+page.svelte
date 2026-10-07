<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '#lib/components/blocks/PageHeader.svelte';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
	import AsyncView from '#lib/components/blocks/AsyncView.svelte';
	import EmptyState from '#lib/components/blocks/EmptyState.svelte';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { AppError } from '#lib/core/errors.js';
	import { Query } from '#lib/core/query.svelte.js';
	import { toast } from 'svelte-sonner';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import type { LucideIcon } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Explicit, like `formatDate`: the runtime's default locale is not the page's.
	const numbers = new Intl.NumberFormat('en');

	const items = new Query<string[]>();

	async function load(fail = false) {
		await items.run(async () => {
			await new Promise((r) => setTimeout(r, 800));
			if (fail) throw new AppError('NETWORK', 'The demo endpoint is unreachable.');
			return ['Item A', 'Item B', 'Item C'];
		});

		// A later failure keeps the list on screen, so it is reported here.
		if (items.error && items.data !== null) toast.error(items.error.message);
	}

	// Starts empty, so the empty state, the data and a failure are each a click away.
	onMount(() => items.run(async () => []));
</script>

<DocumentTitle title="Dashboard" />

<div class="flex flex-col gap-6">
	<PageHeader title="Dashboard" description="Welcome to your app. Start building here.">
		{#snippet actions()}
			<Button variant="outline" size="sm" onclick={() => load(true)}>Simulate failure</Button>
			<Button size="sm" onclick={() => load()}>Load demo data</Button>
		{/snippet}
	</PageHeader>

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

	<!-- Loaded by the page itself, for data the user triggers. -->
	<section>
		<h2 class="mb-3 text-sm font-medium text-muted-foreground">Client-side Query demo</h2>
		<AsyncView source={items}>
			{#snippet children(list)}
				<ul class="divide-y rounded-lg border">
					{#each list as item (item)}
						<li class="px-4 py-3 text-sm">{item}</li>
					{/each}
				</ul>
			{/snippet}

			{#snippet empty()}
				<EmptyState
					title="No items yet"
					description="Click 'Load demo data' to see the AsyncView pattern in action."
				>
					{#snippet icon()}
						<InboxIcon class="size-5" />
					{/snippet}
					{#snippet action()}
						<Button variant="outline" size="sm" onclick={() => load()}>Load demo data</Button>
					{/snippet}
				</EmptyState>
			{/snippet}
		</AsyncView>
	</section>
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
