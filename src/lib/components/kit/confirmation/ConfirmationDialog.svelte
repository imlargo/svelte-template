<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';

	interface Props extends DialogPrimitive.RootProps {
		title: string;
		description: string;

		showCancel?: boolean;
		confirmText?: string;
		cancelText?: string;

		onconfirm?: () => void;
		oncancel?: () => void;

		children?: Snippet;
		variant?: 'destructive' | 'default';
	}

	let {
		title,
		description,
		showCancel = true,
		confirmText = 'Continue',
		cancelText = 'Cancel',
		onconfirm,
		oncancel,
		children,
		open = $bindable(false),
		variant = 'default',
		...rest
	}: Props = $props();
</script>

<Dialog.Root bind:open {...rest}>
	{#if children}
		<Dialog.Trigger>
			{@render children?.()}
		</Dialog.Trigger>
	{/if}

	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{description}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="gap-2">
			{#if showCancel}
				<Button
					variant="secondary"
					onclick={() => {
						open = false;
						oncancel?.();
					}}>{cancelText}</Button
				>
			{/if}

			<Button {variant} type="submit" onclick={onconfirm}>{confirmText}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
