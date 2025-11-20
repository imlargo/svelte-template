<script lang="ts">
	import * as AvatarUI from '$lib/components/ui/avatar/index.js';
	import { getInitials } from '$lib/shared/tools';
	import { cn } from '$lib/utils';

	type Props = {
		name?: string;
		imageUrl?: string;
		class?: string;
		fallbackClass?: string;
	};

	const { name, imageUrl, class: className, fallbackClass }: Props = $props();
</script>

<AvatarUI.Root class={cn('size-10', className)}>
	{#if imageUrl}
		<AvatarUI.Image src={imageUrl} alt={name} class="object-cover" />
	{/if}
	<AvatarUI.Fallback class={fallbackClass}>{getInitials(name)}</AvatarUI.Fallback>
</AvatarUI.Root>
