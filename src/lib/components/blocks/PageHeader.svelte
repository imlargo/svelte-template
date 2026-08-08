<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
		actions,
		class: className
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
		class?: string;
	} = $props();
</script>

<div class={cn('flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between', className)}>
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">{title}</h1>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
