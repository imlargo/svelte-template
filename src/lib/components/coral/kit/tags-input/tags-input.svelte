<script lang="ts">
	/**
	 * @coral/kit/tags-input
	 * @version 1.0.0
	 */
	import { tick } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { cn } from '#lib/utils.js';
	import { focusRing } from '../../lib/focus.js';
	import { add, split } from './tags.js';
	import type { TagsInputProps } from './types.js';

	let {
		value = $bindable([]),
		inputValue = $bindable(''),
		onchange,
		onreject,
		delimiter = ',',
		max,
		allowDuplicates = false,
		validate,
		sanitize = (raw: string) => raw.trim(),
		addOnBlur = true,
		clearable = false,
		clearLabel = 'Clear all',
		removeLabel = (tag: string) => `Remove ${tag}`,
		required = false,
		name,
		form,
		disabled = false,
		readonly = false,
		tagVariant = 'secondary',
		class: className,
		inputClass,
		tagClass,
		tag,
		ref = $bindable(null),
		oninput,
		onkeydown,
		onblur,
		onpaste,
		...restProps
	}: TagsInputProps = $props();

	/** The box, needed to reach the remove controls by position - see `focusTag`. */
	let box = $state<HTMLDivElement | null>(null);

	const mutable = $derived(!disabled && !readonly);
	const showClear = $derived(clearable && mutable && value.length > 0);

	function commit(tags: string[]) {
		value = tags;
		onchange?.(tags);
	}

	/**
	 * Writes state and element together, the element even when the state is unchanged: typing `,`
	 * into an empty field leaves the draft empty on both sides, so nothing re-renders and the
	 * field is left showing the `,` that was already spent as a separator.
	 */
	function setDraft(next: string) {
		inputValue = next;
		if (ref) ref.value = next;
	}

	/**
	 * The one way a tag comes into being - by delimiter, paste or blur. Reports whether anything got
	 * through, which is what tells the field to clear: text turned away stays put, to be fixed
	 * rather than retyped.
	 */
	function accept(incoming: string[]): boolean {
		if (!mutable) return false;

		const { tags, rejected } = add(incoming, {
			current: value,
			sanitize,
			validate,
			allowDuplicates,
			max
		});

		if (rejected.length > 0) onreject?.(rejected);

		// `add` returns the current list by identity when nothing got through.
		if (tags === value) return false;

		commit(tags);
		return true;
	}

	/**
	 * Focus *is* the highlighted tag: no second notion of selection to keep in sync, and nothing to
	 * announce that the browser does not announce already. Real buttons rather than a roving
	 * tabindex, so Tab reaches them too - the arrow keys are a shortcut, not the only way in.
	 */
	function focusTag(index: number) {
		box?.querySelectorAll<HTMLButtonElement>('[data-coral-tag]')[index]?.focus();
	}

	/**
	 * Which way an arrow key points, in reading order. Read off the element rather than a `dir`
	 * prop: a control inside an RTL subtree gets it right without being told twice.
	 */
	function arrow(event: KeyboardEvent, element: HTMLElement): -1 | 0 | 1 {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return 0;
		const back = getComputedStyle(element).direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
		return event.key === back ? -1 : 1;
	}

	function remove(index: number) {
		if (!mutable) return;

		// Read before the removal: afterwards the control that had focus is gone from the DOM, and
		// focus on nothing is focus on the body - the keyboard would start over at the top of the
		// page. Only what was focused inside the box gets moved, so a removal driven from the
		// outside does not steal focus.
		const from = box?.contains(document.activeElement) ?? false;

		commit(value.filter((_, at) => at !== index));
		if (!from) return;

		tick().then(() => {
			if (value.length === 0) ref?.focus();
			else focusTag(Math.min(index, value.length - 1));
		});
	}

	function clear() {
		if (!mutable) return;
		commit([]);
		ref?.focus();
	}

	/**
	 * Everything typed and everything pasted lands here, and the delimiter separates tags in both.
	 * The fragment after the last delimiter stays in the field: pasting `red, blue` leaves `blue`
	 * being typed, which is also where it ends up if the paste had no trailing comma at all.
	 */
	function settle(raw: string) {
		const parts = split(raw, delimiter);

		if (parts.length < 2) {
			inputValue = raw;
		} else {
			setDraft(parts.pop() ?? '');
			accept(parts);
		}
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		settle(event.currentTarget.value);

		// The caller's handler runs last on the way in, so what it reads is the field as it settled
		// rather than the delimiter that has already been spent.
		oninput?.(event);
	}

	/**
	 * A single-line field flattens pasted line breaks into spaces before `input` fires, so a column
	 * copied from a spreadsheet would arrive as one tag. Text without a line break is left alone.
	 */
	function handlePaste(event: ClipboardEvent & { currentTarget: HTMLInputElement }) {
		onpaste?.(event);
		if (event.defaultPrevented || !mutable) return;

		const text = event.clipboardData?.getData('text') ?? '';
		if (!/[\r\n]/.test(text)) return;

		event.preventDefault();
		const field = event.currentTarget;
		// Where a paste would have gone: over the selection, or at the caret.
		const from = field.selectionStart ?? field.value.length;
		const to = field.selectionEnd ?? from;
		settle(field.value.slice(0, from) + text + field.value.slice(to));
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		// ...and first on the way through the keyboard, so a caller can take a key for themselves.
		// Calling `preventDefault` is how they say so - the same signal the browser reads.
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		if (event.key === 'Enter') {
			// An empty field is left to the form: Enter there is a submit, not an empty tag. This is
			// also why the key is only swallowed when it had something to do - a tags input that
			// eats every Enter is a form that cannot be submitted from the keyboard.
			if (!mutable || sanitize(inputValue) === '') return;
			event.preventDefault();
			if (accept([inputValue])) setDraft('');
			return;
		}

		// Everything below steps out of the field and onto the tags, so it only applies while there
		// is nothing being typed - otherwise Backspace would delete a tag instead of a character.
		if (inputValue !== '' || value.length === 0) return;

		if (event.key === 'Backspace' || arrow(event, event.currentTarget) === -1) {
			event.preventDefault();
			focusTag(value.length - 1);
		}
	}

	function handleBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
		if (addOnBlur && inputValue !== '' && accept([inputValue])) setDraft('');
		onblur?.(event);
	}

	function handleTagKeydown(
		event: KeyboardEvent & { currentTarget: HTMLButtonElement },
		index: number
	) {
		if (event.key === 'Backspace' || event.key === 'Delete') {
			event.preventDefault();
			remove(index);
			return;
		}

		const step = arrow(event, event.currentTarget);
		if (step === -1) {
			event.preventDefault();
			focusTag(Math.max(0, index - 1));
			return;
		}
		if (step === 1) {
			event.preventDefault();
			if (index === value.length - 1) ref?.focus();
			else focusTag(index + 1);
			return;
		}

		if (event.key === 'Escape') {
			ref?.focus();
			return;
		}

		/**
		 * A printable key while a tag is focused goes back into the field, so the keyboard is never in
		 * a dead end. Space is left out: it activates the button, and taking that away breaks the one
		 * key every screen reader user expects.
		 */
		if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			setDraft(inputValue + event.key);
			ref?.focus();
		}
	}
</script>

<!--
	The bordered box is the primitive's, not Coral's: the focus ring, the disabled dimming and the
	`aria-invalid` state all come from `input-group` reacting to the field inside it, so a tags input
	sits next to a plain input without either of them being told what a field looks like. What is
	added here is layout only - the row wraps, and it grows with its contents instead of staying one
	line tall. The tags sit inside the box, so it pads and gaps them.
-->
<InputGroup.Root bind:ref={box} class={cn('h-auto min-h-8 flex-wrap gap-1 p-1', className)}>
	{#each value as entry, index (index)}
		<!-- Keyed by position, not by value: two tags may legitimately read the same. -->
		<Badge variant={tagVariant} class={cn('max-w-full', tagClass)}>
			{#if tag}
				{@render tag({ value: entry, index, remove: () => remove(index) })}
			{:else}
				<span class="min-w-0 truncate">{entry}</span>
			{/if}

			{#if mutable}
				<!--
					`data-icon` is the badge's own hook for trimming the padding on the side an icon
					sits; `data-coral-tag` is how the arrow keys find this control by position.
				-->
				<button
					type="button"
					data-coral-tag={index}
					data-icon="inline-end"
					aria-label={removeLabel(entry)}
					class={cn('inline-flex shrink-0 items-center justify-center', focusRing)}
					onclick={() => remove(index)}
					onkeydown={(event) => handleTagKeydown(event, index)}
				>
					<XIcon class="size-3" />
				</button>
			{/if}
		</Badge>
	{/each}

	<!--
		`flex-1` with a floor on it: the field takes the rest of its row, so clicking the empty part
		of the box lands on it, and it wraps to a line of its own rather than shrinking to a slot
		too narrow to read what is being typed.

		`required` only while the list is empty, so the browser's own validation guards the tags
		rather than whatever happens to be half-typed in the field. Its padding drops to sit level with
		the tags.
	-->
	<InputGroup.Input
		bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
		value={inputValue}
		{disabled}
		{readonly}
		{form}
		required={required && value.length === 0}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onpaste={handlePaste}
		onblur={handleBlur}
		class={cn('h-6 w-auto min-w-24 flex-1 px-1.5', inputClass)}
		{...restProps}
	/>

	{#if showClear}
		<InputGroup.Button size="icon-sm" aria-label={clearLabel} onclick={clear}>
			<XIcon />
		</InputGroup.Button>
	{/if}
</InputGroup.Root>

<!--
	One hidden input per tag, the shape a server already reads as a list. The visible field never
	carries the name: it holds what is being typed, which is precisely what has not been added yet.
-->
{#if name}
	{#each value as entry, index (index)}
		<input type="hidden" {name} {form} value={entry} />
	{/each}
{/if}
