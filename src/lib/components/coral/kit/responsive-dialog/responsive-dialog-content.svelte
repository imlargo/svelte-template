<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.0.0
	 */
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogContentProps } from './types.js';

	let {
		ref = $bindable(null),
		showCloseButton,
		children,
		...restProps
	}: ResponsiveDialogContentProps = $props();

	const dialog = getResponsiveDialog();
</script>

{#if dialog.desktop}
	<Dialog.Content bind:ref {showCloseButton} {...restProps}>
		{@render children?.()}
	</Dialog.Content>
{:else}
	<Drawer.Content bind:ref {...restProps}>
		{@render children?.()}
	</Drawer.Content>
{/if}
