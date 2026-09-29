<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.0.0
	 */
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogSectionProps } from './types.js';

	let { ref = $bindable(null), children, ...restProps }: ResponsiveDialogSectionProps = $props();

	const dialog = getResponsiveDialog();
</script>

{#if dialog.desktop}
	<Dialog.Header bind:ref {...restProps}>{@render children?.()}</Dialog.Header>
{:else}
	<Drawer.Header bind:ref {...restProps}>{@render children?.()}</Drawer.Header>
{/if}
