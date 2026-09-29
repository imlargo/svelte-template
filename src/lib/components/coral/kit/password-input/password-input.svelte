<script lang="ts">
	/**
	 * @coral/kit/password-input
	 * @version 1.0.0
	 */
	import { flushSync } from 'svelte';
	import ArrowBigUpDashIcon from '@lucide/svelte/icons/arrow-big-up-dash';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import type { PasswordInputProps } from './types.js';

	let {
		value = $bindable(),
		visible = $bindable(false),
		capsLock = $bindable(false),
		toggleLabel = 'Show password',
		capsLockLabel = 'Caps Lock is on',
		hideOnSubmit = true,
		onvisiblechange,
		id,
		autocomplete = 'current-password',
		disabled = false,
		class: className,
		groupClass,
		capsLockIndicator,
		ref = $bindable(null),
		onkeydown,
		onkeyup,
		onblur,
		...restProps
	}: PasswordInputProps = $props();

	const uid = $props.id();
	const fieldId = $derived(id ?? `${uid}-password`);

	function toggle() {
		// Changing `type` resets the caret in some engines, which lands the reader at the start of a
		// password they were halfway through correcting. The selection is read before the switch and
		// put back after it; the element has to exist in its new type first, hence the flush.
		const start = ref?.selectionStart ?? null;
		const end = ref?.selectionEnd ?? null;

		flushSync(() => (visible = !visible));
		onvisiblechange?.(visible);

		if (ref && start !== null && end !== null) ref.setSelectionRange(start, end);
	}

	/**
	 * `getModifierState` is the only reliable read: tracking `CapsLock` keydowns misses a lock that
	 * was already on when the page loaded, and gets the state backwards on macOS, which fires the
	 * key event after the light has already changed.
	 */
	function readCapsLock(event: KeyboardEvent) {
		if (typeof event.getModifierState !== 'function') return;
		capsLock = event.getModifierState('CapsLock');
	}

	/**
	 * A password manager decides whether to offer saving by looking for a `type="password"` field
	 * when the form submits. Submitted while shown, the field is plain text: the offer never comes,
	 * or the browser files the password into its autofill history for ordinary text fields. The
	 * switch happens synchronously inside `submit`, which runs before the form is serialized.
	 */
	$effect(() => {
		const owner = ref?.form;
		if (!hideOnSubmit || !owner) return;

		const hide = () => {
			if (visible) flushSync(() => (visible = false));
		};
		owner.addEventListener('submit', hide, { capture: true });
		return () => owner.removeEventListener('submit', hide, { capture: true });
	});
</script>

<InputGroup.Root class={groupClass}>
	<!--
		Spellcheck and autocorrect stay off in both states. Once shown, the field is a text field to
		the browser, and enhanced spellcheck services send the contents of text fields to a server.
	-->
	<InputGroup.Input
		bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
		bind:value
		id={fieldId}
		type={visible ? 'text' : 'password'}
		spellcheck={false}
		autocapitalize="off"
		autocorrect="off"
		{autocomplete}
		{disabled}
		class={className}
		onkeydown={(event) => {
			readCapsLock(event);
			onkeydown?.(event);
		}}
		onkeyup={(event) => {
			readCapsLock(event);
			onkeyup?.(event);
		}}
		onblur={(event) => {
			// Caps Lock can change while focus is elsewhere; a stale warning is worse than none.
			capsLock = false;
			onblur?.(event);
		}}
		{...restProps}
	/>

	<InputGroup.Addon align="inline-end">
		{#if capsLock}
			{#if capsLockIndicator}
				{@render capsLockIndicator()}
			{:else}
				<!-- `title` for the sighted reader who does not recognise the glyph; the status region
				     below is what a screen reader hears. -->
				<span class="flex" title={capsLockLabel} aria-hidden="true">
					<ArrowBigUpDashIcon />
				</span>
			{/if}
		{/if}

		<!--
			A toggle button, so `aria-pressed` carries the state and the name stays put. Swapping the
			name between "Show" and "Hide" instead makes a screen reader announce a different control
			after every press, and it is never clear which of the two words describes the current state.
		-->
		<InputGroup.Button
			size="icon-sm"
			aria-label={toggleLabel}
			aria-pressed={visible}
			aria-controls={fieldId}
			{disabled}
			onclick={toggle}
		>
			{#if visible}
				<EyeOffIcon />
			{:else}
				<EyeIcon />
			{/if}
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>

<!-- Polite: the warning is heard while typing, without interrupting what is being read. -->
<LiveRegion message={capsLock ? capsLockLabel : ''} />
