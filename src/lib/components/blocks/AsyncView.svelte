<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { Query } from '$lib/core/query.svelte';
	import { normalizeError, type AppError } from '$lib/core/errors';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import EmptyState from '$lib/components/blocks/EmptyState.svelte';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

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

	// A list that came back with nothing is the only "empty" this knows about.
	function isEmpty(data: T): boolean {
		return Array.isArray(data) && data.length === 0;
	}
</script>

{#snippet pending()}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="flex flex-1 items-center justify-center py-12">
			<Spinner class="size-6 text-muted-foreground" />
		</div>
	{/if}
{/snippet}

{#snippet failed(err: AppError)}
	{#if errorSnippet}
		{@render errorSnippet(err)}
	{:else}
		<EmptyState title="Something went wrong" description={err.message}>
			{#snippet icon()}
				<CircleAlertIcon class="text-destructive" />
			{/snippet}
		</EmptyState>
	{/if}
{/snippet}

{#snippet settled(data: T)}
	{#if isEmpty(data)}
		{#if emptySnippet}
			{@render emptySnippet()}
		{:else}
			<EmptyState title="No results found." />
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
