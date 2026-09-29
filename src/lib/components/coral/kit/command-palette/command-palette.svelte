<script lang="ts">
	/**
	 * @coral/kit/command-palette
	 * @version 1.0.0
	 */
	import * as Command from '$lib/components/ui/command/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Action } from '../../lib/action.svelte.js';
	import { debounce } from '../../lib/debounce.js';
	import { onClose } from '../../lib/on-close.svelte.js';
	import Shortcut from '../shortcut/shortcut.svelte';
	import { ariaKeyshortcuts, parse } from '../shortcut/keys.js';
	import { listen } from '../shortcut/listen.js';
	import { PlatformState } from '../shortcut/platform.svelte.js';
	import { group, remember, searchValue } from './actions.js';
	import { swallowsVimKey } from './bindings.js';
	import type { CommandAction } from './actions.js';
	import type { CommandPaletteProps } from './types.js';

	let {
		actions,
		open = $bindable(false),
		shortcut = 'mod+k',
		bindActionShortcuts = true,
		recent = $bindable([]),
		maxRecent = 5,
		recentLabel = 'Recent',
		search = $bindable(''),
		onsearch,
		searchDebounce = 0,
		loading = false,
		onrun,
		onerror,
		placeholder = 'Type a command or search...',
		emptyMessage = 'No results found.',
		vimBindings,
		class: className,
		listClass,
		trigger,
		action: actionSnippet,
		indicator,
		empty,
		footer,
		...restProps
	}: CommandPaletteProps = $props();

	const action = new Action();

	/** Which action is in flight, so only its own row reports that something is happening. */
	let running = $state<string | null>(null);

	const uid = $props.id();
	const listId = `${uid}-list`;

	const groups = $derived(group(actions, { recent, maxRecent, recentLabel }));

	/** Each action's position in the list as drawn, which is what its element id is built from. */
	const positions = $derived(
		new Map(groups.flatMap((entry) => entry.actions).map((item, position) => [item.id, position]))
	);

	/** The primitive's highlighted value is the row's search string; this turns it back into an id. */
	let highlighted = $state('');
	const activeId = $derived.by(() => {
		if (loading || highlighted === '') return undefined;
		const match = actions.find((item) => searchValue(item) === highlighted);
		return match ? `${listId}-${positions.get(match.id)}` : undefined;
	});

	const detected = new PlatformState();
	const platform = $derived(detected.current);

	/** The primitive's vim bindings give way to combos the caller binds; `vimBindings` overrides. */
	const swallowed = $derived(
		swallowsVimKey([shortcut, ...actions.map((entry) => entry.shortcut)], platform)
	);

	$effect(() => {
		if (!shortcut) return;
		// Bound whether or not the palette is open, so the same combo is what closes it again.
		return listen(shortcut, () => (open = !open));
	});

	/**
	 * Each action's own shortcut, bound for as long as the palette is mounted. This is what makes the
	 * combo drawn beside an action true everywhere rather than only inside the list - and it is one
	 * listener per action rather than a keymap the project has to keep in step with this list.
	 */
	$effect(() => {
		if (!bindActionShortcuts) return;

		const bound = actions
			.filter((entry) => entry.shortcut && !entry.disabled)
			.map((entry) => listen(entry.shortcut as string, () => run(entry)));

		return () => bound.forEach((stop) => stop());
	});

	const searchLater = debounce(
		(term: string) => onsearch?.(term),
		() => searchDebounce
	);
	$effect(() => () => searchLater.cancel());

	/** Forgets the term on any close; `run` closes by assigning `open`, which the primitive does not report. */
	onClose(
		() => open,
		() => {
			searchLater.cancel();
			if (search !== '') onsearch?.('');
			search = '';
		}
	);

	/**
	 * Runs an action and decides whether the palette has earned the right to close - the convention
	 * `lib/action` holds: exactly `false`, or a throw, keeps it open, which is what lets a failed
	 * action report itself somewhere the reader is still looking.
	 *
	 * The action is remembered whether or not it succeeded at what it does: the reader reached for
	 * it, and that is what `recent` is a record of.
	 */
	async function run(entry: CommandAction) {
		if (entry.disabled || action.running) return;

		running = entry.id;
		recent = remember(recent, entry.id);

		try {
			if (await action.run(entry.run)) {
				open = false;
				onrun?.(entry);
			}
		} catch (error) {
			if (!onerror) throw error;
			onerror(error, entry);
		} finally {
			running = null;
		}
	}

	const triggerProps = $derived({
		type: 'button' as const,
		'aria-haspopup': 'dialog' as const,
		'aria-expanded': open,
		'aria-keyshortcuts': shortcut ? ariaKeyshortcuts(parse(shortcut, platform)) : undefined,
		onclick: () => (open = true)
	});
</script>

{@render trigger?.({ props: triggerProps, open })}

<!--
	`shouldFilter` is left to the primitive by default: it scores every row against `searchValue`,
	which is why keywords travel inside that string. With `onsearch` the list is the server's answer
	and filtering it again locally would hide rows the server meant to return.
-->
<Command.Dialog
	bind:open
	bind:value={highlighted}
	vimBindings={vimBindings ?? !swallowed}
	shouldFilter={!onsearch}
	class={className}
	{...restProps}
>
	<!-- `aria-controls` and `aria-activedescendant` by hand: see `kit/combobox`. -->
	<Command.Input
		aria-controls={listId}
		aria-activedescendant={activeId}
		bind:value={search}
		{placeholder}
		oninput={(event) => searchLater(event.currentTarget.value)}
	/>

	<!-- A listbox may only own options and groups, so it is hidden while the results are on their way. -->
	<Command.List id={listId} class={listClass} hidden={loading}>
		{#if !loading}
			<Command.Empty>
				<!-- A listbox must own options; the primitive says when it is empty, and this is what it holds. -->
				<div role="option" aria-selected="false" aria-disabled="true">
					{#if empty}{@render empty()}{:else}{emptyMessage}{/if}
				</div>
			</Command.Empty>

			{#each groups as entry, index (entry.label ?? index)}
				<Command.Group heading={entry.label}>
					{#each entry.actions as item (item.id)}
						<Command.Item
							id={`${listId}-${positions.get(item.id)}`}
							value={searchValue(item)}
							disabled={item.disabled}
							class="data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={() => run(item)}
						>
							{#if actionSnippet}
								{@render actionSnippet({ action: item, pending: running === item.id })}
							{:else}
								<span class="flex min-w-0 flex-col">
									<span class="truncate">{item.label}</span>
									{#if item.description}
										<span class="truncate text-xs text-muted-foreground">{item.description}</span>
									{/if}
								</span>

								{#if running === item.id}
									<Spinner class="ms-auto opacity-50" />
								{:else if item.shortcut}
									<!-- Drawn, not bound, from here: the binding above is what makes it work, and
									     it is live whether or not this row is on screen. -->
									<Shortcut keys={item.shortcut} class="ms-auto" />
								{/if}
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
			{/each}
		{/if}
	</Command.List>

	{#if loading}
		<Command.Loading>
			{#if indicator}
				{@render indicator()}
			{:else}
				<div class="flex items-center justify-center py-6">
					<Spinner class="opacity-50" />
				</div>
			{/if}
		</Command.Loading>
	{/if}

	{@render footer?.()}
</Command.Dialog>
