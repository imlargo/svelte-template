<script lang="ts">
	/**
	 * @coral/kit/copy-button
	 * @version 1.0.0
	 */
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Announcer } from '../../lib/announce.svelte.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import { resolveText, writeText } from './clipboard.js';
	import type { CopyButtonProps } from './types.js';

	let {
		text,
		timeout = 2000,
		status = $bindable('idle'),
		oncopy,
		onerror,
		label = 'Copy to clipboard',
		copiedLabel = 'Copied',
		failedLabel = 'Copy failed',
		variant = 'ghost',
		size,
		disabled,
		onclick,
		children,
		ref = $bindable(null),
		...restProps
	}: CopyButtonProps = $props();

	let timer: ReturnType<typeof setTimeout> | undefined;

	// A reset firing after unmount would write to state nothing reads any more.
	$effect(() => () => clearTimeout(timer));

	/**
	 * What the button says out loud. Swapping its own `aria-label` is how most copy buttons report
	 * success, and screen readers do not announce a changed name on the element that already has
	 * focus - so the reader who most needs the confirmation hears nothing. A status region is
	 * announced wherever focus is, and `Announcer` is what makes a second copy of the same value
	 * heard again rather than landing in a region that already holds those words.
	 */
	const announcer = new Announcer();

	function settle(next: 'copied' | 'failed') {
		status = next;
		announcer.say(next === 'copied' ? copiedLabel : failedLabel);
		clearTimeout(timer);
		timer = setTimeout(() => {
			status = 'idle';
			announcer.clear();
		}, timeout);
	}

	async function copy(event: MouseEvent) {
		// The caller runs first and can take the click for itself - `preventDefault` is how it says so.
		onclick?.(event);
		if (event.defaultPrevented || status === 'copying') return;

		// Only a slow source shows `copying`. Setting it for a plain string would flash one frame of
		// a state nobody can see, and cancel the timer of a copy that just succeeded for nothing.
		const source = typeof text === 'function' ? text : null;
		if (source) status = 'copying';

		try {
			const resolved = await resolveText(source ?? text);
			await writeText(resolved);
			settle('copied');
			oncopy?.(resolved);
		} catch (error) {
			settle('failed');
			onerror?.(error);
		}
	}
</script>

<Button
	bind:ref
	type="button"
	{variant}
	size={size ?? (children ? 'default' : 'icon')}
	{disabled}
	aria-label={children ? undefined : label}
	aria-busy={status === 'copying' ? 'true' : undefined}
	data-status={status}
	onclick={copy}
	{...restProps}
>
	{#if children}
		{@render children({ status })}
	{:else if status === 'copied'}
		<CheckIcon />
	{:else if status === 'failed'}
		<XIcon />
	{:else}
		<CopyIcon />
	{/if}
</Button>

<LiveRegion message={announcer.message} />
