<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AsyncViewState } from '$lib/types/ui/view-state';
	import type { ViewState } from '$lib/core/helpers/view-state.svelte';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let {
		viewState,
		children,
		loading: loadingSnippet,
		empty: emptySnippet,
		error: errorSnippet
	}: {
		viewState: ViewState | { state: AsyncViewState; error?: string | null };
		children: Snippet;
		loading?: Snippet;
		empty?: Snippet;
		error?: Snippet<[{ message: string | null }]>;
	} = $props();
</script>

{#if viewState.state === 'loading'}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
		</div>
	{/if}
{:else if viewState.state === 'error'}
	{#if errorSnippet}
		{@render errorSnippet({ message: viewState.error ?? null })}
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
			<AlertCircleIcon class="size-8 text-destructive" />
			<p class="text-sm font-medium text-destructive">Something went wrong</p>
			{#if viewState.error}
				<p class="text-sm text-muted-foreground">{viewState.error}</p>
			{/if}
		</div>
	{/if}
{:else if viewState.state === 'empty'}
	{#if emptySnippet}
		{@render emptySnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<p class="text-sm text-muted-foreground">No results found.</p>
		</div>
	{/if}
{:else if viewState.state === 'success' || viewState.state === 'idle'}
	{@render children()}
{/if}
