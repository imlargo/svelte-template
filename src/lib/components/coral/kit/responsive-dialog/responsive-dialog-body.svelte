<script lang="ts">
	/**
	 * @coral/kit/responsive-dialog
	 * @version 1.1.0
	 */
	import { cn } from '#lib/utils.js';
	import { getResponsiveDialog } from './context.js';
	import type { ResponsiveDialogSectionProps } from './types.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ResponsiveDialogSectionProps = $props();

	const dialog = getResponsiveDialog();
</script>

<!--
	What sits between the header and the footer. The dialog pads everything inside it and the drawer
	pads only its header and footer, so the same form touches the screen edges on a phone unless this
	piece puts the drawer's own inset back. It is also the part that scrolls: the surfaces cap their
	height, and the header and footer stay in place while a form taller than the screen moves.
-->
<div
	bind:this={ref}
	data-slot="responsive-dialog-body"
	class={cn('min-h-0 overflow-y-auto', !dialog.desktop && 'px-4', className)}
	{...restProps}
>
	{@render children?.()}
</div>
