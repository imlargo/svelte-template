<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.0.0
	 */
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogTitleProps } from './types.js';

	let { ref = $bindable(null), ...restProps }: ResponsiveDialogTitleProps = $props();

	const dialog = getResponsiveDialog();
</script>

{#if dialog.desktop}
	<Dialog.Title bind:ref {...restProps} />
{:else}
	<Drawer.Title bind:ref {...restProps} />
{/if}
