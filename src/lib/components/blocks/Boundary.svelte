<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import EmptyState from '#lib/components/blocks/EmptyState.svelte';
	import { normalizeError } from '#lib/core/errors.js';
	import { logger } from '#lib/core/logger.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

	let {
		children,
		failed: failedSnippet
	}: {
		children: Snippet;
		/** Replaces the default panel. Gets a message that is safe to show, and a retry. */
		failed?: Snippet<[message: string, reset: () => void]>;
	} = $props();
</script>

<!-- A `<svelte:boundary>` with the app's error rules applied: a crash while
     rendering or in an effect is logged once, and the panel only ever shows a
     message `normalizeError` vouches for. Errors in event handlers are not
     rendering errors and do not reach here: those are the caller's try/catch. -->
<svelte:boundary onerror={(error) => logger.error('ui', error)}>
	{@render children()}

	{#snippet failed(error, reset)}
		{@const message = normalizeError(error).message}
		{#if failedSnippet}
			{@render failedSnippet(message, reset)}
		{:else}
			<EmptyState title="This section could not be displayed." description={message}>
				{#snippet icon()}
					<CircleAlertIcon class="text-destructive" />
				{/snippet}
				{#snippet action()}
					<Button variant="outline" size="sm" onclick={reset}>Try again</Button>
				{/snippet}
			</EmptyState>
		{/if}
	{/snippet}
</svelte:boundary>
