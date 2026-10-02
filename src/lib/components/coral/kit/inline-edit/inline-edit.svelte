<script lang="ts">
	/**
	 * @coral/kit/inline-edit
	 * @version 1.0.0
	 */
	import { tick, untrack } from 'svelte';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';
	import { Action } from '../../lib/action.svelte.js';
	import { focusRing } from '../../lib/focus.js';
	import type { InlineEditProps } from './types.js';

	let {
		value = $bindable(''),
		editing = $bindable(false),
		onsave,
		onerror,
		oncancel,
		validate,
		sanitize = (raw: string) => raw.trim(),
		required = false,
		saveOnBlur = true,
		selectOnEdit = true,
		placeholder = '',
		editLabel = (current: string) => (current ? `Edit ${current}` : 'Edit'),
		disabled = false,
		class: className,
		inputClass,
		display,
		ref = $bindable(null),
		oninput,
		onkeydown,
		onblur,
		...restProps
	}: InlineEditProps = $props();

	const action = new Action();

	let draft = $state('');
	let invalid = $state(false);
	let trigger = $state<HTMLButtonElement | null>(null);

	/**
	 * Whether focus should go back to the value once editing ends. Only when it was in the field:
	 * an edit committed because the reader clicked somewhere else must not pull focus back from
	 * wherever they clicked.
	 */
	let restoreFocus = false;

	/**
	 * Every way into editing lands here - a click, F2, or `editing` bound to true from outside - so
	 * the draft is always taken from the saved value, never left over from an abandoned edit.
	 */
	let wasEditing = false;
	$effect(() => {
		if (editing && !wasEditing) {
			draft = untrack(() => value ?? '');
			invalid = false;
			tick().then(() => {
				ref?.focus();
				if (selectOnEdit) ref?.select();
			});
		}
		wasEditing = editing;
	});

	function start() {
		if (disabled) return;
		editing = true;
	}

	function finish() {
		const refocus = restoreFocus;
		restoreFocus = false;
		editing = false;
		if (refocus) tick().then(() => trigger?.focus());
	}

	async function save() {
		if (action.running || !editing) return;

		const next = sanitize(draft);
		if (next === value) {
			finish();
			return;
		}

		if ((required && next === '') || (validate && !validate(next))) {
			invalid = true;
			return;
		}
		invalid = false;

		// A throw leaves `editing` alone on its way out, which is exactly "stay open".
		try {
			if (await action.run(() => onsave?.(next))) {
				value = next;
				finish();
			}
		} catch (error) {
			if (!onerror) throw error;
			onerror(error);
		}
	}

	function cancel() {
		// `!editing`: some engines fire a blur as the committed field is unmounted, which must not
		// report a cancel for an edit that was just saved.
		if (action.running || !editing) return;
		finish();
		oncancel?.();
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented || event.isComposing) return;

		if (event.key === 'Enter') {
			event.preventDefault();
			restoreFocus = true;
			save();
		} else if (event.key === 'Escape') {
			// Kept from bubbling: inside a dialog, Escape here means "stop renaming", not "close".
			event.preventDefault();
			event.stopPropagation();
			restoreFocus = true;
			cancel();
		}
	}

	function handleBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
		onblur?.(event);
		// A blur while saving is the field going read-only under the reader, not a decision.
		if (action.running) return;
		restoreFocus = false;
		if (saveOnBlur) save();
		else cancel();
	}
</script>

{#if editing}
	<!--
		`readonly` while saving, not `disabled`: disabling the focused field would blur it, and the blur
		would read as the reader leaving - committing or cancelling an edit that is already being saved.
	-->
	<InputGroup.Root class={className}>
		<InputGroup.Input
			bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
			bind:value={draft}
			{placeholder}
			readonly={action.running}
			aria-busy={action.running ? 'true' : undefined}
			aria-invalid={invalid ? 'true' : undefined}
			class={inputClass}
			oninput={(event) => {
				invalid = false;
				oninput?.(event);
			}}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			{...restProps}
		/>
		{#if action.running}
			<InputGroup.Addon align="inline-end">
				<Spinner aria-hidden="true" />
			</InputGroup.Addon>
		{/if}
	</InputGroup.Root>
{:else}
	<!--
		A real button, so the value is reachable by Tab and opens with Enter or Space without a
		`role` and a key handler bolted onto a span. F2 is added because it is what renaming is bound
		to in every file manager.
	-->
	<button
		bind:this={trigger}
		type="button"
		{disabled}
		aria-label={editLabel(value ?? '')}
		class={cn(
			'inline-flex max-w-full min-w-0 cursor-text items-center text-start disabled:cursor-default',
			focusRing,
			className
		)}
		onclick={start}
		onkeydown={(event) => {
			if (event.key !== 'F2') return;
			event.preventDefault();
			start();
		}}
	>
		{#if display}
			{@render display({ value: value ?? '', placeholder })}
		{:else if value}
			<span class="min-w-0 truncate">{value}</span>
		{:else}
			<span class="min-w-0 truncate text-muted-foreground">{placeholder}</span>
		{/if}
	</button>
{/if}
