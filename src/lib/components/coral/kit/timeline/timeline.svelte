<script lang="ts" generics="T">
	/**
	 * @coral/kit/timeline
	 * @version 1.0.0
	 */
	import * as Empty from '#lib/components/ui/empty/index.js';
	import { cn } from '#lib/utils.js';
	import ActionButton from '../action-button/action-button.svelte';
	import LiveRegion from '../../lib/live-region.svelte';
	import { Announcer } from '../../lib/announce.svelte.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { dateTimeFormat, relativeTimeFormat } from '../../lib/intl.js';
	import { dayKey, daysBetween, groupByDay } from './days.js';
	import type { TimelineProps } from './types.js';

	const defaults = getCoralDefaults('kit/timeline');

	let {
		items,
		getDate,
		getKey = (_: T, index: number) => index,
		locale = defaults.locale ?? 'en-US',
		timeZone = defaults.timeZone,
		dayFormat = defaults.dayFormat ?? { dateStyle: 'long' },
		timeFormat = defaults.timeFormat ?? { timeStyle: 'short' },
		headingLevel = 3,
		now,
		hasMore = false,
		onloadmore,
		onerror,
		loadMoreLabel = defaults.loadMoreLabel ?? 'Show older',
		loadedMessage = defaults.loadedMessage ?? ((count: number) => `${count} older loaded`),
		emptyMessage = defaults.emptyMessage ?? 'Nothing here yet.',
		ref = $bindable(null),
		class: className,
		headingClass,
		listClass,
		itemClass,
		item: itemSnippet,
		heading,
		empty,
		...restProps
	}: TimelineProps<T> = $props();

	const groups = $derived(groupByDay(items, getDate, timeZone));
	const today = $derived(dayKey(now ?? new Date(), timeZone));

	const dayText = $derived(dateTimeFormat(locale, { ...dayFormat, timeZone }));
	const timeText = $derived(dateTimeFormat(locale, { ...timeFormat, timeZone }));
	const relative = $derived(relativeTimeFormat(locale, { numeric: 'auto' }));

	/**
	 * "Today" and "Yesterday" from `Intl`, in the reader's language, which hands them back lower-case
	 * in most of them. A heading starts with a capital, so the first letter is raised the way the
	 * locale raises it.
	 */
	function labelFor(key: string, day: Date): string {
		const offset = daysBetween(today, key);
		if (offset !== 0 && offset !== -1) return dayText.format(day);
		const words = relative.format(offset, 'day');
		return words.charAt(0).toLocaleUpperCase(locale) + words.slice(1);
	}

	/** Where the next batch starts, so what arrived can be counted and said. */
	let before = 0;
	const announcer = new Announcer();

	/** Each row's position in the whole list, which the groups otherwise hide. */
	const offsets = $derived.by(() => {
		let position = 0;
		return groups.map((group) => group.items.map(() => position++));
	});
</script>

<div bind:this={ref} class={cn('flex flex-col gap-6', className)} {...restProps}>
	{#if groups.length === 0 && !hasMore}
		{#if empty}
			{@render empty()}
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Title>{emptyMessage}</Empty.Title>
				</Empty.Header>
			</Empty.Root>
		{/if}
	{/if}

	{#each groups as group, groupIndex (group.key)}
		{@const offset = daysBetween(today, group.key)}
		{@const label = labelFor(group.key, group.day)}
		<section class="flex flex-col gap-3">
			<!-- A real heading, at the level the page says, so the days are what the H key walks. -->
			<svelte:element this={`h${headingLevel}`} class={headingClass}>
				{#if heading}
					{@render heading({ day: group.day, label, offset })}
				{:else}
					{label}
				{/if}
			</svelte:element>

			<!-- `role="list"` restated: Safari drops list semantics from a list with its bullets removed. -->
			<ol role="list" class={cn('flex flex-col gap-3', listClass)}>
				{#each group.items as entry, index (getKey(entry.item, offsets[groupIndex][index]))}
					<li class={cn('flex items-baseline gap-3', itemClass)}>
						<!-- `<time datetime>` carries the exact instant for machines; the text is the reader's clock. -->
						<time datetime={entry.date.toISOString()} class="shrink-0 text-muted-foreground">
							{timeText.format(entry.date)}
						</time>
						<div class="min-w-0 flex-1">
							{@render itemSnippet({
								item: entry.item,
								date: entry.date,
								index: offsets[groupIndex][index]
							})}
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	{#if hasMore}
		<!--
			Older events are appended below, where the control already is, so nothing the reader has
			read moves. The control keeps focus while it waits and afterwards, and how many arrived is
			said out loud, since a list that silently grew under the reader looks exactly like one that
			did not.
		-->
		<ActionButton
			variant="outline"
			class="self-start"
			onclick={() => {
				before = items.length;
				return onloadmore?.();
			}}
			onsuccess={() => {
				const added = items.length - before;
				if (added > 0) announcer.say(loadedMessage(added));
			}}
			{onerror}
		>
			{loadMoreLabel}
		</ActionButton>
	{/if}
</div>

<LiveRegion message={announcer.message} />
