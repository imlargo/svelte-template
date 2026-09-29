<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.0.0
	 */
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogDescriptionProps } from './types.js';

	let { ref = $bindable(null), ...restProps }: ResponsiveDialogDescriptionProps = $props();

	const dialog = getResponsiveDialog();
</script>

{#if dialog.desktop}
	<Dialog.Description bind:ref {...restProps} />
{:else}
	<Drawer.Description bind:ref {...restProps} />
{/if}
