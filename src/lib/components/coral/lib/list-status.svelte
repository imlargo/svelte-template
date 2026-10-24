<script lang="ts">
	/**
	 * @coral/lib/list-status
	 * @version 1.0.0
	 */
	import type { Snippet } from 'svelte';
	import { Spinner } from '#lib/components/ui/spinner/index.js';

	let {
		message,
		loading = false,
		children
	}: {
		/** The one line the row says - nothing matched, or the options are on their way. */
		message: string;
		/** Draws a spinner before the message. */
		loading?: boolean;
		/** Replaces the row's contents. The row itself, and its role, stay. */
		children?: Snippet;
	} = $props();
</script>

<!--
	The row a select, a combobox or a palette shows while its list has nothing to pick: the results
	are loading, or nothing matched. It is an option nothing can select, because a listbox may own
	nothing but options and groups, and hiding the list instead leaves the reader's arrow keys with
	nowhere to go. The message is not announced from here - the component that owns the list keeps
	the live region, so the words land in a region that was already on the page.
-->
<div
	role="option"
	aria-selected="false"
	aria-disabled="true"
	data-slot="coral-list-status"
	class="flex items-center justify-center gap-2 py-6 text-muted-foreground"
>
	{#if children}
		{@render children()}
	{:else}
		{#if loading}
			<Spinner aria-hidden="true" />
		{/if}
		{message}
	{/if}
</div>
