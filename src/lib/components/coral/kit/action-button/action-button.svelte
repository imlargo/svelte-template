<script lang="ts">
	/**
	 * @coral/kit/action-button
	 * @version 1.0.0
	 */
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import { Action } from '../../lib/action.svelte.js';
	import type { ActionButtonProps } from './types.js';

	let {
		onclick,
		onsuccess,
		onerror,
		pending,
		pendingLabel = 'Loading',
		disabled = false,
		type = 'button',
		class: className,
		children,
		ref = $bindable(null),
		...restProps
	}: ActionButtonProps = $props();

	const action = new Action();
	const busy = $derived(pending ?? action.running);

	async function handleClick(event: MouseEvent) {
		// A submit button that is busy must not submit the form a second time either.
		if (busy) {
			event.preventDefault();
			return;
		}
		if (!onclick) return;

		try {
			if (await action.run(() => onclick(event))) onsuccess?.();
		} catch (error) {
			if (!onerror) throw error;
			onerror(error);
		}
	}
</script>

<!--
	Busy is `aria-disabled`, not `disabled`. Disabling the button that has focus drops focus to the
	document body in every engine, so a keyboard user who pressed Enter is thrown back to the top of
	the page the moment the request starts. `aria-disabled` keeps the button focused and announced as
	unavailable, and the click guard above does the actual blocking.
-->
<Button
	bind:ref
	{type}
	{disabled}
	aria-disabled={busy ? 'true' : undefined}
	aria-busy={busy ? 'true' : undefined}
	data-pending={busy || undefined}
	class={cn('data-pending:cursor-progress', className)}
	onclick={handleClick}
	{...restProps}
>
	{#if busy}
		<!-- Hidden: the button's children are presentational, so a status inside it is never read. -->
		<Spinner data-icon="inline-start" aria-hidden="true" />
	{/if}
	{@render children?.({ pending: busy })}
</Button>

<LiveRegion message={busy ? pendingLabel : ''} />
