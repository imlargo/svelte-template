<script lang="ts" generics="T">
	/**
	 * @coral/kit/stepper
	 * @version 1.0.0
	 */
	import { tick } from 'svelte';
	import { cn } from '#lib/utils.js';
	import { Action } from '../../lib/action.svelte.js';
	import { setStepper } from './context.js';
	import { adjacent, canVisit, complete, stateOf } from './steps.js';
	import type { StepperContext } from './context.js';
	import type { StepperProps } from './types.js';

	let {
		steps,
		value = $bindable(),
		completed = $bindable([]),
		linear = true,
		onbeforenext,
		onfinish,
		onerror,
		onvaluechange,
		orientation = 'horizontal',
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: StepperProps<T> = $props();

	const uid = $props.id();
	const action = new Action();

	/** `value` left unset means the first step, without writing it back and firing a change. */
	const current = $derived(value !== undefined && steps.includes(value) ? value : steps[0]);
	const index = $derived(steps.indexOf(current));

	function move(step: T) {
		if (step === current) return;
		value = step;
		onvaluechange?.(step);
	}

	/**
	 * Moves focus to the panel that just appeared. After Next, the button that was pressed may be
	 * gone - replaced by "Finish", or disabled on the last step - and focus on a removed element is
	 * focus on the page body. The panel is named by its step, so landing on it also tells a screen
	 * reader where the reader now is. Only when focus was inside the stepper: a step changed from
	 * code must not pull focus from wherever it is.
	 */
	async function focusPanel(step: T) {
		if (!ref?.contains(document.activeElement)) return;
		await tick();
		document.getElementById(`${uid}-content-${steps.indexOf(step)}`)?.focus();
	}

	const context: StepperContext<T> = {
		get steps() {
			return steps;
		},
		get value() {
			return current;
		},
		get orientation() {
			return orientation;
		},
		get pending() {
			return action.running;
		},
		get isFirst() {
			return index <= 0;
		},
		get isLast() {
			return index === steps.length - 1;
		},
		stateOf: (step) => stateOf(step, current, completed),
		canVisit: (step) => canVisit(step, { steps, current, completed, linear }),
		goTo(step) {
			if (action.running || !canVisit(step, { steps, current, completed, linear })) return;
			move(step);
		},
		async next() {
			const leaving = current;
			const last = index === steps.length - 1;

			let done: boolean;
			try {
				done = await action.run(async () => {
					if (onbeforenext && (await onbeforenext(leaving)) === false) return false;
					if (last) return onfinish?.();
				});
			} catch (error) {
				if (!onerror) throw error;
				onerror(error);
				return false;
			}
			if (!done) return false;

			completed = complete(completed, leaving);
			const following = adjacent(steps, leaving, 1);
			if (following !== undefined) {
				move(following);
				focusPanel(following);
			}
			return true;
		},
		previous() {
			const before = adjacent(steps, current, -1);
			if (action.running || before === undefined) return;
			move(before);
			focusPanel(before);
		},
		triggerId: (step) => `${uid}-trigger-${steps.indexOf(step)}`,
		contentId: (step) => `${uid}-content-${steps.indexOf(step)}`
	};

	setStepper(context as StepperContext);
</script>

<div
	bind:this={ref}
	data-orientation={orientation}
	aria-busy={action.running ? 'true' : undefined}
	class={cn('flex gap-4', orientation === 'vertical' ? 'flex-row' : 'flex-col', className)}
	{...restProps}
>
	{@render children?.(context)}
</div>
