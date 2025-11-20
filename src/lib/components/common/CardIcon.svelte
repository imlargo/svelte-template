<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		icon: Snippet<[{ props?: Record<string, any> }]>;
		title: string;
		description: string;
		children: Snippet;
	};

	const { icon, title, description, children }: Props = $props();
</script>

<Card.Root>
	<Card.Header>
		{@render icon?.({ props: { class: 'size-4 text-muted-foreground' } })}
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>

	{@render children?.()}
</Card.Root>
