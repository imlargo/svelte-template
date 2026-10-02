<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { cn } from '#lib/utils.js';

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

<Empty.Root class={cn('border', className)}>
	<Empty.Header>
		{#if icon}
			<Empty.Media variant="icon">{@render icon()}</Empty.Media>
		{/if}
		<Empty.Title>{title}</Empty.Title>
		{#if description}
			<Empty.Description>{description}</Empty.Description>
		{/if}
	</Empty.Header>
	{#if action}
		<Empty.Content>{@render action()}</Empty.Content>
	{/if}
</Empty.Root>
