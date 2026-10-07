<script lang="ts">
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { cn } from '#lib/utils.js';

	// Ellipsis plus the full text in a tooltip, and only when the text really
	// was cut: a tooltip repeating what is already readable is noise. The width
	// cap is the caller's (`class="max-w-md"`).
	let { text, class: className }: { text: string; class?: string } = $props();

	let node = $state<HTMLButtonElement | null>(null);
	let truncated = $state(false);

	$effect(() => {
		const el = node;
		if (!el) return;

		// Reads `text` so a row reusing the node with new content re-measures.
		const measure = () => {
			truncated = text.length > 0 && el.scrollWidth > el.clientWidth;
		};
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<Tooltip.Root>
	<Tooltip.Trigger
		bind:ref={node}
		disabled={!truncated}
		class={cn('block max-w-full truncate text-left', className)}
	>
		{text}
	</Tooltip.Trigger>
	<Tooltip.Content>{text}</Tooltip.Content>
</Tooltip.Root>
