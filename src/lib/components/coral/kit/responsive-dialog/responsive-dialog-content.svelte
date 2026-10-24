<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.1.0
	 */
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { cn } from '#lib/utils.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogContentProps } from './types.js';

	let {
		ref = $bindable(null),
		showCloseButton,
		class: className,
		children,
		...restProps
	}: ResponsiveDialogContentProps = $props();

	const dialog = getResponsiveDialog();
</script>

<!--
	The dialog is a column capped at the viewport, less the gutter the primitive already keeps on the
	sides, so a body inside it can scroll while the header and footer hold. The drawer is one already.
-->
{#if dialog.desktop}
	<Dialog.Content
		bind:ref
		{showCloseButton}
		class={cn('flex max-h-[calc(100%-2rem)] flex-col', className)}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Content>
{:else}
	<Drawer.Content bind:ref {...restProps}>
		{@render children?.()}
	</Drawer.Content>
{/if}
