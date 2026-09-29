<script lang="ts">
	/**
	 * @coral/kit/scrub-input
	 * @version 1.0.0
	 */
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { cn } from '$lib/utils.js';
	import { decimalsOf } from '../../lib/number.js';
	import { numberField, numberFieldClass } from '../../lib/number-field.js';
	import { amountFor, consume } from './scrub.js';
	import type { ScrubInputProps } from './types.js';

	let {
		label,
		value = $bindable(),
		min,
		max,
		step = 1,
		largeStep,
		decimals,
		pixelsPerStep = 2,
		onchange,
		onscrubstart,
		onscrubend,
		suffix,
		disabled = false,
		readonly = false,
		id,
		class: className,
		groupClass,
		handleClass,
		handle,
		ref = $bindable(null),
		...restProps
	}: ScrubInputProps = $props();

	const uid = $props.id();
	const fieldId = $derived(id ?? `${uid}-field`);
	const places = $derived(decimals ?? decimalsOf(step));
	const coarse = $derived(largeStep ?? step * 10);
	const mutable = $derived(!disabled && !readonly);

	let scrubbing = $state(false);

	/** The pointer that started the drag. A second finger landing mid-drag is not this drag. */
	let pointer: number | null = null;
	/** Distance travelled but not yet worth a whole step - see `consume`. */
	let rest = 0;
	let lastX = 0;
	/** What the value was when the drag began, for the Escape that takes it all back. */
	let started: number | undefined;
	/** Whether the pointer moved at all, which is what tells a drag from a click. */
	let moved = false;

	const field = numberField({
		value: () => value,
		set: (next) => (value = next),
		min: () => min,
		max: () => max,
		decimals: () => places,
		editable: () => mutable,
		onchange: () => onchange
	});

	function begin(event: PointerEvent, node: HTMLLabelElement) {
		if (!mutable || event.button !== 0 || scrubbing) return;

		node.setPointerCapture(event.pointerId);
		pointer = event.pointerId;
		scrubbing = true;
		moved = false;
		rest = 0;
		lastX = event.clientX;
		started = value;
		onscrubstart?.(value);
	}

	/**
	 * A click is what a drag ends with, so the browser reports one on the handle either way. Its
	 * default - focusing the field, because this is a `<label>` - is taken over rather than left to
	 * run: at the end of a drag it would steal focus, and on a real click the field is focused here
	 * and its number selected, ready to be typed over.
	 */
	function press(event: MouseEvent) {
		event.preventDefault();
		if (moved || disabled) return;
		ref?.focus();
		ref?.select();
	}

	/**
	 * The drag is wired here rather than with `onpointerdown` and friends in the markup.
	 *
	 * A `<label>` is not an interactive element, and pointer handlers written onto one are exactly
	 * what the accessibility lint rules are there to catch: usually they mean a control that the
	 * keyboard cannot reach. Here the keyboard reaches the value through the field itself, which
	 * steps with the arrow keys, and the handle adds a pointer gesture on top of it - so the warning
	 * is answered by the design rather than silenced, and the whole gesture ends up in one place.
	 */
	function scrubbable(node: HTMLLabelElement) {
		const down = (event: PointerEvent) => begin(event, node);
		const up = () => end();
		const cancel = () => end(true);

		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointercancel', cancel);
		node.addEventListener('click', press);

		return () => {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', cancel);
			node.removeEventListener('click', press);
		};
	}

	function move(event: PointerEvent) {
		if (!scrubbing || event.pointerId !== pointer) return;

		const delta = event.clientX - lastX;
		lastX = event.clientX;
		if (delta === 0) return;

		moved = true;
		const taken = consume(rest + delta, pixelsPerStep);
		rest = taken.rest;
		if (taken.steps !== 0) field.nudge(taken.steps * amountFor(step, coarse, event.shiftKey));
	}

	function end(revert = false) {
		if (!scrubbing) return;

		if (revert) field.commit(started);
		scrubbing = false;
		pointer = null;
		rest = 0;
		onscrubend?.(value);
	}

	/** Escape gives the value back, from wherever the pointer happens to be. */
	$effect(() => {
		if (!scrubbing) return;

		const onKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			end(true);
		};

		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	/**
	 * Up and Down step, the way a spinbutton does, and Shift makes them coarse. Left and Right are
	 * left alone: in a text field they move the caret, and taking that away makes the number
	 * impossible to edit. Handled here rather than by the browser so that the coarse modifier and
	 * the bounds behave identically everywhere - engines disagree on all of it.
	 */
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		if (!mutable) return;

		const amount = amountFor(step, coarse, event.shiftKey);
		const text = event.currentTarget;

		/** Each key returns whether it acted; one that did not is left to the caret or a dialog above. */
		const keys: Record<string, () => boolean> = {
			ArrowUp: () => (field.nudge(amount), true),
			ArrowDown: () => (field.nudge(-amount), true),
			PageUp: () => (field.nudge(coarse), true),
			PageDown: () => (field.nudge(-coarse), true),
			Home: () => min !== undefined && (field.commit(min), true),
			End: () => max !== undefined && (field.commit(max), true),
			// Puts back what the field held before the edit that is still being typed.
			Escape: () => {
				const held = value === undefined ? '' : String(value);
				if (text.value === held) return false;
				text.value = held;
				// The first Escape is the field's, the second is the dialog's - the rule search-input
				// and inline-edit follow.
				event.stopPropagation();
				return true;
			}
		};

		if (keys[event.key]?.()) event.preventDefault();
	}
</script>

<InputGroup.Root class={cn('max-w-max', groupClass)}>
	<InputGroup.Addon>
		<!--
			A real `<label>`, so the text names the field for assistive tech and a plain click focuses
			it - the drag is an extra the pointer gets, not a replacement for anything. It is not
			focusable and carries no `role`: from the keyboard the field itself already steps, and a
			second control for the same number would be a second tab stop that adds nothing.
		-->
		<label
			for={fieldId}
			data-scrubbing={scrubbing || undefined}
			class={cn(
				'inline-flex touch-none items-center select-none',
				mutable ? 'cursor-ew-resize' : 'cursor-default',
				handleClass
			)}
			{@attach scrubbable}
		>
			{#if handle}
				{@render handle({ label, scrubbing })}
			{:else}
				{label}
			{/if}
		</label>
	</InputGroup.Addon>

	<!--
		`type="number"` for what the platform already gives: a spinbutton to assistive tech, with its
		`min`, `max` and `step` announced, and a numeric keypad on a phone. The native spinner arrows
		are hidden, because this field is driven by the handle and the keyboard.
	-->
	<InputGroup.Input
		bind:ref={() => ref, (node) => (ref = node as HTMLInputElement | null)}
		id={fieldId}
		type="number"
		inputmode={places > 0 ? 'decimal' : 'numeric'}
		{value}
		{min}
		{max}
		{step}
		{disabled}
		{readonly}
		onchange={field.change}
		onkeydown={handleKeydown}
		onwheel={field.wheel}
		class={cn(numberFieldClass, className)}
		{...restProps}
	/>

	{#if suffix}
		<InputGroup.Addon align="inline-end">
			<InputGroup.Text>{suffix}</InputGroup.Text>
		</InputGroup.Addon>
	{/if}
</InputGroup.Root>
