<script lang="ts">
	/**
	 * @coral/kit/shortcut
	 * @version 1.0.0
	 */
	import { Kbd, KbdGroup } from '#lib/components/ui/kbd/index.js';
	import { parse, tokens } from './keys.js';
	import { listen } from './listen.js';
	import { PlatformState } from './platform.svelte.js';
	import type { ShortcutProps } from './types.js';

	let {
		keys,
		onpress,
		enabled = true,
		allowInFields,
		preventDefault = true,
		platform,
		key: keySnippet,
		ref = $bindable(null),
		...restProps
	}: ShortcutProps = $props();

	/**
	 * The platform once mounted, `other` before - see `PlatformState`. Pass `platform` when the server
	 * does know it, from a user-agent header, and there is nothing to correct after mount.
	 */
	const detected = new PlatformState();

	const resolved = $derived(platform ?? detected.current);
	const drawn = $derived(tokens(parse(keys, resolved), resolved));

	$effect(() => {
		if (!onpress || !enabled) return;
		return listen(keys, (event) => onpress(event), {
			platform: resolved,
			allowInFields,
			preventDefault
		});
	});
</script>

<KbdGroup bind:ref {...restProps}>
	{#each drawn as token, index (index)}
		{#if keySnippet}
			{@render keySnippet(token)}
		{:else}
			<!--
				The symbol is hidden and its name read instead: `⌘` announced by a screen reader is
				"place of interest sign", and `⇧` is "upwards white arrow".
			-->
			<Kbd>
				<span aria-hidden="true">{token.symbol}</span>
				<span class="sr-only">{token.name}</span>
			</Kbd>
		{/if}
	{/each}
</KbdGroup>
