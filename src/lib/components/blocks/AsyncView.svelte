<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { Query } from '$lib/core/query.svelte';
	import type { AppError } from '$lib/core/errors';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let {
		query,
		children,
		loading: loadingSnippet,
		empty: emptySnippet,
		error: errorSnippet
	}: {
		query: Query<T>;
		children: Snippet<[T]>;
		loading?: Snippet;
		empty?: Snippet;
		error?: Snippet<[AppError]>;
	} = $props();

	// A list that came back with nothing is the only "empty" this knows about —
	// no isEmpty prop to configure. Anything else belongs inside `children`.
	const isEmpty = $derived(Array.isArray(query.data) && query.data.length === 0);
</script>

{#if query.isLoading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
		</div>
	{/if}
{:else if query.error}
	{#if errorSnippet}
		{@render errorSnippet(query.error)}
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
			<AlertCircleIcon class="size-8 text-destructive" />
			<p class="text-sm font-medium text-destructive">Something went wrong</p>
			<p class="text-sm text-muted-foreground">{query.error.message}</p>
		</div>
	{/if}
{:else if isEmpty}
	{#if emptySnippet}
		{@render emptySnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<p class="text-sm text-muted-foreground">No results found.</p>
		</div>
	{/if}
{:else if query.data !== null}
	{@render children(query.data)}
{/if}
