<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { Query } from '$lib/core/query.svelte';
	import { normalizeError, type AppError } from '$lib/core/errors';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let {
		source,
		children,
		loading: loadingSnippet,
		empty: emptySnippet,
		error: errorSnippet
	}: {
		/**
		 * A promise a `load` returned without awaiting — streamed, so navigation
		 * does not wait for it — or a `Query` the page runs itself.
		 */
		source: Query<T> | Promise<T>;
		children: Snippet<[T]>;
		loading?: Snippet;
		empty?: Snippet;
		error?: Snippet<[AppError]>;
	} = $props();

	// A list that came back with nothing is the only "empty" this knows about —
	// no isEmpty prop to configure. Anything else belongs inside `children`.
	function isEmpty(data: T): boolean {
		return Array.isArray(data) && data.length === 0;
	}
</script>

{#snippet pending()}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
		</div>
	{/if}
{/snippet}

{#snippet failed(err: AppError)}
	{#if errorSnippet}
		{@render errorSnippet(err)}
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
			<AlertCircleIcon class="size-8 text-destructive" />
			<p class="text-sm font-medium text-destructive">Something went wrong</p>
			<p class="text-sm text-muted-foreground">{err.message}</p>
		</div>
	{/if}
{/snippet}

{#snippet settled(data: T)}
	{#if isEmpty(data)}
		{#if emptySnippet}
			{@render emptySnippet()}
		{:else}
			<div class="flex flex-1 items-center justify-center py-12">
				<p class="text-sm text-muted-foreground">No results found.</p>
			</div>
		{/if}
	{:else}
		{@render children(data)}
	{/if}
{/snippet}

{#if source instanceof Promise}
	{#await source}
		{@render pending()}
	{:then data}
		{@render settled(data)}
	{:catch err}
		{@render failed(normalizeError(err))}
	{/await}
{:else if source.error}
	{@render failed(source.error)}
{:else if source.data !== null}
	<!-- A refetch keeps what is on screen until the new result lands: search and
	     mutations update the list instead of blanking it to a spinner. -->
	{@render settled(source.data)}
{:else if source.isLoading}
	{@render pending()}
{/if}
