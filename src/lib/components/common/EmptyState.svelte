<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
		icon,
		action,
		class: className
	}: {
		title: string;
		description?: string;
		icon?: Snippet;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center',
		className
	)}
>
	{#if icon}
		<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
			{@render icon()}
		</div>
	{/if}
	<div class="flex flex-col gap-1">
		<p class="text-sm font-medium">{title}</p>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
