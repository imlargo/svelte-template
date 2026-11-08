<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Breadcrumbs from '#lib/components/coral/kit/breadcrumbs/breadcrumbs.svelte';
	import type { Crumb } from '#lib/components/coral/kit/breadcrumbs/types.js';
	import { cn } from '#lib/utils.js';

	let {
		title,
		description,
		eyebrow,
		breadcrumbs = [],
		actions,
		class: className,
		...restProps
	}: Omit<HTMLAttributes<HTMLElement>, 'title'> & {
		title: string | Snippet;
		description?: string | Snippet;
		/** A line above the title: the section, a status, a count. */
		eyebrow?: string;
		/** The trail from the section root to this page, above the title. */
		breadcrumbs?: Crumb[];
		/** Page-level actions, aligned right from `sm` up. */
		actions?: Snippet;
	} = $props();
</script>

<header
	class={cn('flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between', className)}
	{...restProps}
>
	<div class="flex min-w-0 flex-col gap-1">
		{#if breadcrumbs.length > 0}
			<Breadcrumbs items={breadcrumbs} />
		{/if}
		{#if eyebrow}
			<p class="text-xs text-muted-foreground">{eyebrow}</p>
		{/if}
		<h1 class="text-2xl font-semibold tracking-tight">
			{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
		</h1>
		{#if description}
			<p class="text-sm text-muted-foreground">
				{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
			</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 flex-wrap items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</header>
