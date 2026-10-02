/**
 * @coral/kit/stepper
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes, HTMLOlAttributes } from 'svelte/elements';
import type { Button } from '#lib/components/ui/button/index.js';
import type { StepperContext } from './context.js';
import type { StepState } from './steps.js';

export type StepperProps<T> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** Every step, in order. Anything comparable with `===` - ids, strings, the step objects. */
	steps: readonly T[];
	/** The current step. Bindable. Defaults to the first. */
	value?: T;
	/** Steps finished with Next. Bindable, so a saved draft can restore how far someone got. */
	completed?: readonly T[];
	/** Refuses jumping ahead to a step while an earlier one is incomplete. */
	linear?: boolean;
	/**
	 * Runs when Next is pressed, with the step being left. Return a promise and the stepper waits;
	 * return exactly `false`, or throw, and it stays on that step - the convention every Coral
	 * component that waits on a request follows. Validation belongs here.
	 */
	onbeforenext?: (step: T) => unknown;
	/** Runs when Next is pressed on the last step, after `onbeforenext`. Same `false` convention. */
	onfinish?: () => unknown;
	/**
	 * Receives whatever `onbeforenext` or `onfinish` threw. The stepper stays on the step either
	 * way. Without it the error propagates as an unhandled rejection.
	 */
	onerror?: (error: unknown) => void;
	/** The current step changed. Never on mount, never when `value` is set from code. */
	onvaluechange?: (step: T) => void;
	/** Which arrow keys move between steps in the list. */
	orientation?: 'horizontal' | 'vertical';
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Receives the shared state, for a layout that needs more than the pieces expose. */
	children?: Snippet<[StepperContext<T>]>;
};

export type StepperListProps = HTMLOlAttributes & {
	ref?: HTMLOListElement | null;
};

export type StepContext = {
	state: StepState;
	index: number;
	/** Whether the step can be jumped to right now. */
	disabled: boolean;
};

export type StepperItemProps<T> = Omit<HTMLAttributes<HTMLButtonElement>, 'children'> & {
	/** Which step this is. */
	step: T;
	ref?: HTMLButtonElement | null;
	/** Merged onto the `<li>` around the button. */
	itemClass?: string;
	/** What the step shows - its number, title, description, a check once complete. */
	children: Snippet<[StepContext]>;
};

export type StepperContentProps<T> = HTMLAttributes<HTMLDivElement> & {
	/** Which step this panel belongs to. */
	step: T;
	/**
	 * Keeps the panel in the page while another step is showing, hidden. Needed when every step's
	 * fields submit in one `<form>` - an unmounted field is not submitted.
	 */
	keepMounted?: boolean;
	ref?: HTMLDivElement | null;
};

type ButtonProps = Omit<ComponentProps<typeof Button>, 'href' | 'onclick' | 'children'>;

export type StepperPreviousProps = ButtonProps & {
	/** The label, when the children are left out. */
	label?: string;
	children?: Snippet;
};

export type StepperNextProps = ButtonProps & {
	/** The label on every step but the last, when the children are left out. */
	nextLabel?: string;
	/** The label on the last step, when the children are left out. */
	finishLabel?: string;
	/** Replaces the label. Receives where the stepper is, for a button that changes with the step. */
	children?: Snippet<[{ isLast: boolean; pending: boolean }]>;
};

export type { StepperContext } from './context.js';
export type { StepState } from './steps.js';
