<script lang="ts">
	import { Button, type ButtonProps } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';

	// A wrapper, not a modified Button. Disabled alone says "not now"; the
	// spinner says "it is happening", and disabling on top prevents a double submit.
	let {
		loading = false,
		disabled,
		children,
		...restProps
	}: ButtonProps & { loading?: boolean } = $props();
</script>

<Button {...restProps} disabled={disabled || loading}>
	{#if loading}
		<Spinner />
	{/if}
	{@render children?.()}
</Button>
