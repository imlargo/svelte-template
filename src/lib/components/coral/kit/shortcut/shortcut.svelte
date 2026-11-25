<script lang="ts">
	/**
	 * @coral/kit/shortcut
	 * @version 1.1.0
	 */
	import { Kbd, KbdGroup } from '#lib/components/ui/kbd/index.js';
	import { parse, tokens } from './keys.js';
	import { listen } from './listen.js';
	import { PlatformState } from './platform.svelte.js';
	import type { ShortcutProps } from './types.js';

	let {
		keys,
		onpress,
		activate = false,
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

	/** The control `activate` clicks: the closest button or link the keys are drawn in. */
	const owner = () =>
		ref?.closest<HTMLElement>('button, a[href], [role="button"], [role="menuitem"]');

	/**
	 * Whether a modal dialog the shortcut is not part of is open. Everything behind a modal is out
	 * of reach of the pointer and the Tab key, and a key that still reached it would act on a page
	 * the reader cannot see: an `n` for a new project firing while a delete confirmation is open.
	 *
	 * Only the topmost modal counts, and a shortcut after it in the document is not behind it: a
	 * menu or a popover opened from inside the dialog is portaled to the end of the page, outside
	 * the dialog's element but above it.
	 */
	function covered(): boolean {
		if (!ref) return false;
		const modals = document.querySelectorAll('[aria-modal="true"], dialog:modal');
		const top = modals[modals.length - 1];
		if (!top || top.contains(ref)) return false;
		return !(top.compareDocumentPosition(ref) & Node.DOCUMENT_POSITION_FOLLOWING);
	}

	$effect(() => {
		if ((!onpress && !activate) || !enabled) return;
		// `preventDefault` is applied here rather than by `listen`, so a covered shortcut leaves the
		// key to whatever the modal does with it.
		return listen(
			keys,
			(event) => {
				if (covered()) return;
				const control = activate ? owner() : undefined;
				if (activate && (!control || control.matches(':disabled, [aria-disabled="true"]'))) {
					return;
				}
				if (preventDefault) event.preventDefault();
				onpress?.(event);
				control?.click();
			},
			{ platform: resolved, allowInFields, preventDefault: false }
		);
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
