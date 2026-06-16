<script lang="ts">
	import { PageHeader, AsyncView, EmptyState } from '$lib/components/common';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ViewState } from '$lib/core/helpers/view-state.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const viewState = new ViewState();
	let items: string[] = $state([]);

	async function loadItems() {
		const result = await viewState.run(
			async () => {
				await new Promise((r) => setTimeout(r, 800));
				return ['Item A', 'Item B', 'Item C'];
			},
			{ isEmpty: (r) => r.length === 0 }
		);
		if (result) items = result;
	}
</script>

<div class="flex flex-col gap-6">
	<PageHeader
		title="Dashboard"
		description="Welcome to your app. Start building here."
	>
		{#snippet actions()}
			<Button size="sm" onclick={loadItems}>Load demo data</Button>
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
		<AsyncView {viewState}>
			{#snippet children()}
				{#if items.length > 0}
					<ul class="divide-y rounded-lg border">
						{#each items as item}
							<li class="px-4 py-3 text-sm">{item}</li>
						{/each}
					</ul>
				{:else}
					<EmptyState
						title="No items yet"
						description="Click 'Load demo data' to see the AsyncView pattern in action."
					>
						{#snippet icon()}
							<InboxIcon class="size-5" />
						{/snippet}
						{#snippet action()}
							<Button variant="outline" size="sm" onclick={loadItems}>Load demo data</Button>
						{/snippet}
					</EmptyState>
				{/if}
			{/snippet}
		</AsyncView>
	</section>
</div>
