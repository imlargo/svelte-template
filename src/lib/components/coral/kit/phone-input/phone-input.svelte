<script lang="ts">
	/**
	 * @coral/kit/phone-input
	 * @version 1.0.0
	 */
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import { isValidPhoneNumber } from 'libphonenumber-js';
	import type { CountryCode } from 'libphonenumber-js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import CountrySelect from '../country-select/country-select.svelte';
	import { flag } from '../country-select/countries.js';
	import { matches } from '../combobox/matching.js';
	import HiddenField from '../../lib/hidden-field.svelte';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { deleteDigit, indexAfter, significantBefore } from './caret.js';
	import {
		countryOfValue,
		dialCode,
		display,
		matchesDialCode,
		read,
		supportedCountries,
		switchCountry
	} from './phone.js';
	import type { Option } from '../../lib/options.js';
	import type { OptionContext, TriggerContext } from '../combobox/types.js';
	import type { Reading } from './phone.js';
	import type { PhoneInputProps } from './types.js';

	const defaults = getCoralDefaults('kit/phone-input');

	let {
		value = $bindable(),
		country = $bindable(),
		countries,
		locale = defaults.locale ?? 'en-US',
		onchange,
		name,
		form,
		countryLabel = defaults.countryLabel ?? 'Country',
		invalidMessage = defaults.invalidMessage ?? 'Enter a complete phone number.',
		searchPlaceholder = defaults.searchPlaceholder,
		emptyMessage = defaults.emptyMessage,
		autocomplete = 'tel',
		disabled = false,
		readonly = false,
		class: className,
		groupClass,
		ref = $bindable(null),
		oninput,
		...restProps
	}: PhoneInputProps = $props();

	let group = $state<HTMLElement | null>(null);

	const listed = $derived(supportedCountries(countries));

	/** The last edit and the value it produced. It is what shows for as long as `value` is that. */
	let typed = $state<{ text: string; value: string | undefined } | null>(null);
	const ownEdit = $derived(typed !== null && typed.value === value);

	/**
	 * A value assigned from code - a saved record loading - names its own country, and is shown
	 * under it. One typed here belongs to the country it was typed for.
	 */
	const current = $derived(ownEdit ? country : (countryOfValue(value) ?? country));
	const text = $derived(ownEdit && typed ? typed.text : display(value, current));

	/**
	 * Read by the form's own validation, so an incomplete number stops a submit the way a missing
	 * `required` value does. An empty field is left to `required`.
	 */
	const incomplete = $derived(value !== undefined && !isValidPhoneNumber(value));

	$effect(() => {
		ref?.setCustomValidity(incomplete ? invalidMessage : '');
	});

	/** Set when a country is picked, so focus moves on to the number once the list has closed. */
	let picked = false;

	/** The only place `value` is written from, so `onchange` hears every edit and nothing else. */
	function apply(reading: Reading) {
		const changed = reading.value !== value;
		typed = { text: reading.text, value: reading.value };
		value = reading.value;
		country = reading.country;
		if (changed) onchange?.(value);
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		let raw = input.value;
		let caret = input.selectionStart ?? raw.length;

		const kind = event instanceof InputEvent ? event.inputType : '';
		const removedNothing =
			significantBefore(raw, raw.length) === significantBefore(text, text.length);
		if (kind.startsWith('deleteContent') && removedNothing) {
			({ text: raw, caret } = deleteDigit(
				raw,
				caret,
				kind === 'deleteContentForward' ? 'forward' : 'backward'
			));
		}

		let kept = significantBefore(raw, caret);
		apply(read(raw, current));
		// The plus written in for an international number is one more character ahead of the caret.
		if (text.startsWith('+') && !raw.includes('+')) kept++;

		// Set by hand as well: when an edit changes nothing - a space typed into a formatted number -
		// the value Svelte holds is unchanged and it would leave the stray character on screen.
		input.value = text;
		const at = indexAfter(text, kept);
		input.setSelectionRange(at, at);

		oninput?.(event);
	}

	function pick(next: string | undefined) {
		// The list holds only countries with a calling code, and the select cannot be cleared.
		if (next === undefined || next === current) return;
		apply(switchCountry(text, current, next as CountryCode));
		picked = true;
	}

	/** Matches the name, the English name and the code, and the calling code as well: `+44`, `44`. */
	function filter(option: Option<string>, search: string) {
		return matches(option, search) || matchesDialCode(option.value, search);
	}
</script>

{#snippet trigger({ props, selected, disabled: blocked }: TriggerContext<string>)}
	<InputGroup.Button {...props} disabled={blocked} class="gap-1">
		{#if current}
			<!-- The flag is hidden and the name spoken: "flag: Germany" would be read before "Germany". -->
			<span aria-hidden="true">{flag(current)}</span>
			<span class="sr-only">{selected[0]?.label}</span>
			<span>{dialCode(current)}</span>
		{:else}
			<GlobeIcon />
			<span class="sr-only">{countryLabel}</span>
		{/if}
		<ChevronDownIcon class="opacity-50" />
	</InputGroup.Button>
{/snippet}

{#snippet row({ option }: OptionContext<string>)}
	<span aria-hidden="true">{flag(option.value)}</span>
	<span class="flex-1 truncate">{option.label}</span>
	<span class="text-muted-foreground">{dialCode(option.value as CountryCode)}</span>
{/snippet}

<InputGroup.Root bind:ref={group} class={groupClass}>
	<InputGroup.Addon>
		<CountrySelect
			bind:value={() => current, pick}
			countries={listed}
			{locale}
			{searchPlaceholder}
			{emptyMessage}
			disabled={Boolean(disabled || readonly)}
			anchor={group}
			{filter}
			{trigger}
			option={row}
			onOpenChangeComplete={(open) => {
				if (open || !picked) return;
				picked = false;
				ref?.focus();
			}}
		/>
	</InputGroup.Addon>

	<!-- `type="tel"` brings the dial pad on a phone, and `autocomplete="tel"` lets the browser fill a
	     whole international number, which is read like a pasted one. -->
	<InputGroup.Input
		bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
		type="tel"
		value={text}
		{autocomplete}
		{disabled}
		{readonly}
		class={className}
		oninput={handleInput}
		{...restProps}
	/>
</InputGroup.Root>

{#if name}
	<HiddenField {name} {form} value={value ?? ''} />
{/if}
