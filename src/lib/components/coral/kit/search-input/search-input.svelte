<script lang="ts">
	/**
	 * @coral/kit/search-input
	 * @version 1.0.0
	 */
	import { untrack } from 'svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { cn } from '$lib/utils.js';
	import { debounce } from '../../lib/debounce.js';
	import { effectiveTerm, hasChanged } from './term.js';
	import type { SearchInputProps } from './types.js';

	let {
		value = $bindable(''),
		onsearch,
		searchDebounce = 300,
		minLength = 0,
		loading = false,
		clearLabel = 'Clear search',
		disabled = false,
		readonly = false,
		class: className,
		groupClass,
		ref = $bindable(null),
		oninput,
		onkeydown,
		...restProps
	}: SearchInputProps = $props();

	/**
	 * The last term reported, seeded from the initial value, which the caller already searched for.
	 * Plain `let`, not state - nothing renders from it.
	 */
	let reported = untrack(() => effectiveTerm(value ?? '', minLength));

	function report(raw: string) {
		const term = effectiveTerm(raw, minLength);
		if (!hasChanged(term, reported)) return;
		reported = term;
		onsearch?.(term);
	}

	const later = debounce(report, () => searchDebounce);

	/**
	 * The last value this component wrote itself, from typing or clearing. Anything else arriving in
	 * `value` was set from code - a page restoring `?q=cali`, a "reset filters" button - and the
	 * caller already knows what it is searching for: it is adopted as reported, and a search still
	 * waiting on the debounce for the old text is dropped rather than sent after it.
	 *
	 * Telling the two apart by who wrote the value, not by timing, is deliberate. `oninput` is
	 * delegated to the document root while a binding listens on the element itself, and the browser
	 * runs a microtask checkpoint between the two - so an effect keyed on "nothing is pending yet"
	 * fires before the input handler and swallows every term the reader types.
	 */
	let written = untrack(() => value ?? '');

	$effect(() => {
		const current = value ?? '';
		if (current === written) return;
		written = current;
		later.cancel();
		reported = effectiveTerm(current, minLength);
	});

	// A report landing after unmount would search on behalf of a screen that is gone.
	$effect(() => () => later.cancel());

	const showClear = $derived((value ?? '') !== '' && !disabled && !readonly);

	function clear() {
		later.cancel();
		written = '';
		value = '';
		report('');
		ref?.focus();
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const raw = event.currentTarget.value;
		written = raw;
		value = raw;
		oninput?.(event);
		// Mid-composition text is not what the reader means yet - a Japanese or Korean IME emits a run
		// of intermediate strings for one word. The final `input` after composition ends carries it.
		if ('isComposing' in event && event.isComposing) return;
		later(raw);
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.isComposing) return;

		if (event.key === 'Enter') {
			// The reader asked for it now. Waiting out the debounce after an explicit Enter reads as
			// the key being ignored.
			later.cancel();
			report(event.currentTarget.value);
			return;
		}

		// First Escape empties the field; the second is left alone. Stopping propagation only while
		// there is something to clear is what keeps a search inside a dialog or a sheet from closing
		// the whole thing when the reader only meant to clear their term.
		if (event.key === 'Escape' && showClear) {
			event.preventDefault();
			event.stopPropagation();
			clear();
		}
	}
</script>

<InputGroup.Root class={groupClass}>
	<InputGroup.Addon>
		{#if loading}
			<Spinner />
		{:else}
			<SearchIcon aria-hidden="true" />
		{/if}
	</InputGroup.Addon>

	<!--
		`type="search"` for what the platform gives it: the search key on a mobile keyboard, and a
		field assistive tech announces as a search box. The engine's own cancel button is hidden,
		because this component draws one that also reports the cleared search - the native one fires
		nothing but a bare `input` event, and sits in a different place in every browser.
	-->
	<InputGroup.Input
		bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
		{value}
		type="search"
		enterkeyhint="search"
		autocomplete="off"
		aria-busy={loading ? 'true' : undefined}
		{disabled}
		{readonly}
		class={cn('[&::-webkit-search-cancel-button]:appearance-none', className)}
		oninput={handleInput}
		onkeydown={handleKeydown}
		{...restProps}
	/>

	{#if showClear}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button size="icon-xs" aria-label={clearLabel} onclick={clear}>
				<XIcon />
			</InputGroup.Button>
		</InputGroup.Addon>
	{/if}
</InputGroup.Root>
