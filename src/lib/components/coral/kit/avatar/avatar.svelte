<script lang="ts">
	/**
	 * @coral/kit/avatar
	 * @version 1.0.0
	 */
	import { Avatar as Root, AvatarFallback, AvatarImage } from '#lib/components/ui/avatar/index.js';
	import { initials } from './initials.js';
	import type { AvatarProps } from './types.js';

	let {
		src,
		alt,
		name,
		fallback,
		children,
		ref = $bindable(null),
		loadingStatus = $bindable('loading'),
		...restProps
	}: AvatarProps = $props();

	/**
	 * What the avatar is called, image or no image. Without it the accessible name depends on
	 * whether a request succeeded - the person with the photo, "MG" the moment it 404s. Only one of
	 * image and fallback is ever in the tree, so the name cannot double up. `alt=""` means what it
	 * means everywhere: decorative, the name is already in the text beside it.
	 */
	const label = $derived(alt ?? name);
</script>

<Root bind:ref bind:loadingStatus {...restProps}>
	{#if src}
		<AvatarImage {src} alt={label ?? ''} />
	{/if}
	<AvatarFallback>
		<!--
			Hidden from assistive tech whenever the caller has said anything about naming - the name
			itself, carried below, or `alt=""` to say there is nothing to announce. Initials read out
			as letters are never the answer to "who is this", so they only survive when there is no
			name to work from and the caller supplied their own fallback.
		-->
		<span aria-hidden={label !== undefined ? 'true' : undefined}>
			{#if typeof fallback === 'function'}
				{@render fallback()}
			{:else}
				{fallback ?? initials(name)}
			{/if}
		</span>
		{#if label}
			<span class="sr-only">{label}</span>
		{/if}
	</AvatarFallback>
	{@render children?.()}
</Root>
