<script lang="ts">
	/**
	 * @coral/kit/country-select
	 * @version 1.0.0
	 */
	import Combobox from '../combobox/combobox.svelte';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { COUNTRIES, countryOptions, flag } from './countries.js';
	import type { OptionContext, SelectionContext } from '../combobox/types.js';
	import type { CountrySelectProps } from './types.js';

	const defaults = getCoralDefaults('kit/country-select');

	let {
		value = $bindable(),
		open = $bindable(false),
		search = $bindable(''),
		countries = COUNTRIES,
		locale = defaults.locale ?? 'en-US',
		placeholder = defaults.placeholder ?? 'Select a country...',
		searchPlaceholder = defaults.searchPlaceholder ?? 'Search countries...',
		emptyMessage = defaults.emptyMessage ?? 'No country found.',
		clearLabel = defaults.clearLabel ?? 'Clear country',
		selection: selectionSnippet,
		option: optionSnippet,
		...restProps
	}: CountrySelectProps = $props();

	const options = $derived(countryOptions(countries, locale));
</script>

<!-- The flag is hidden from assistive tech: a screen reader would read it as "flag: Germany"
     right before the name it already reads. -->
{#snippet chosen({ selected }: SelectionContext<string>)}
	<span class="flex min-w-0 items-center gap-2">
		<span aria-hidden="true">{flag(selected[0].value)}</span>
		<span class="truncate">{selected[0].label}</span>
	</span>
{/snippet}

{#snippet row({ option }: OptionContext<string>)}
	<span aria-hidden="true">{flag(option.value)}</span>
	<span class="truncate">{option.label}</span>
{/snippet}

<Combobox
	{options}
	bind:value
	bind:open
	bind:search
	{placeholder}
	{searchPlaceholder}
	{emptyMessage}
	{clearLabel}
	selection={selectionSnippet ?? chosen}
	option={optionSnippet ?? row}
	{...restProps}
/>
