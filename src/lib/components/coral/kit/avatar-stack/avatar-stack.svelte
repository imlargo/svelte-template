<script lang="ts" generics="T">
	/**
	 * @coral/kit/avatar-stack
	 * @version 1.0.0
	 */
	import { AvatarGroup, AvatarGroupCount } from '$lib/components/ui/avatar/index.js';
	import Avatar from '../avatar/avatar.svelte';
	import { split } from './overflow.js';
	import type { AvatarStackPerson, AvatarStackProps } from './types.js';

	let {
		items,
		max,
		getPerson = (item: T) => item as AvatarStackPerson,
		getKey = (_: T, index: number) => index,
		size = 'default',
		label,
		overflowLabel = (count: number) => `${count} more`,
		avatar,
		overflow,
		ref = $bindable(null),
		...restProps
	}: AvatarStackProps<T> = $props();

	const parts = $derived(split(items, max));
	const count = $derived(parts.hidden.length);
	const countLabel = $derived(overflowLabel(count));

	/**
	 * The names behind the count, for the sighted reader hovering it. Only the ones that have a name:
	 * a list of blanks and commas says less than nothing.
	 */
	const hiddenNames = $derived(
		parts.hidden
			.map((item) => getPerson(item).name)
			.filter(Boolean)
			.join(', ')
	);
</script>

<!--
	A list, because that is what it is - and a screen reader then says how many people are in it
	before reading them. The roles go on the avatars themselves rather than on wrappers around them:
	the group draws the overlap by targeting its direct children, and a wrapper would flatten it.
-->
<AvatarGroup bind:ref role="list" aria-label={label} {...restProps}>
	{#each parts.visible as item, index (getKey(item, index))}
		{#if avatar}
			{@render avatar({ item, index })}
		{:else}
			{@const person = getPerson(item)}
			<Avatar role="listitem" {size} name={person.name} src={person.src} alt={person.alt} />
		{/if}
	{/each}

	{#if count > 0}
		{#if overflow}
			{@render overflow({ hidden: parts.hidden, count, label: countLabel })}
		{:else}
			<!-- The count sizes itself from the avatars beside it, so `size` needs no second prop. -->
			<AvatarGroupCount role="listitem" aria-label={countLabel} title={hiddenNames || undefined}>
				<span aria-hidden="true">+{count}</span>
			</AvatarGroupCount>
		{/if}
	{/if}
</AvatarGroup>
