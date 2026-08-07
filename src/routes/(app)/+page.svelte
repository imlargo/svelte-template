<script lang="ts">
	import { PageHeader, AsyncView, EmptyState } from '$lib/components/common';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createQuery } from '$lib/core/query.svelte';
	import { toast } from 'svelte-sonner';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import InboxIcon from '@lucide/svelte/icons/inbox';

	const items = createQuery<string[]>();

	// The toast goes here, not inside `run`: core knows nothing about the UI, and
	// only the caller knows whether this particular failure is worth interrupting for.
	async function load(fail = false) {
		await items.run(async () => {
			await new Promise((r) => setTimeout(r, 800));
			if (fail) throw new Error('The demo endpoint is unreachable.');
			return ['Item A', 'Item B', 'Item C'];
		});

		if (items.error) toast.error(items.error.getMessage());
	}
</script>

<div class="flex flex-col gap-6">
	<PageHeader title="Dashboard" description="Welcome to your app. Start building here.">
		{#snippet actions()}
			<Button variant="outline" size="sm" onclick={() => load(true)}>Simulate failure</Button>
			<Button size="sm" onclick={() => load()}>Load demo data</Button>
		{/snippet}
	</PageHeader>

	<!-- Stat cards -->
	<section class="grid gap-4 sm:grid-cols-3">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Total users</Card.Title>
				<UsersIcon class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">1,024</div>
				<p class="text-xs text-muted-foreground">All registered accounts</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Active sessions</Card.Title>
				<ActivityIcon class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">47</div>
				<p class="text-xs text-muted-foreground">Currently online</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between pb-2">
				<Card.Title class="text-sm font-medium">Events today</Card.Title>
				<LayoutDashboardIcon class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">312</div>
				<p class="text-xs text-muted-foreground">Across all sources</p>
			</Card.Content>
		</Card.Root>
	</section>

	<!-- AsyncView + EmptyState demo -->
	<section>
		<h2 class="mb-3 text-sm font-medium text-muted-foreground">AsyncView demo</h2>
		<AsyncView query={items}>
			{#snippet children(data)}
				<ul class="divide-y rounded-lg border">
					{#each data as item (item)}
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
