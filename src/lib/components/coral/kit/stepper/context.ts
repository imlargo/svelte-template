/**
 * @coral/kit/stepper
 * @version 1.0.0
 */

import { createContext } from 'svelte';
import type { StepState } from './steps.js';

export type StepperContext<T = unknown> = {
	readonly steps: readonly T[];
	readonly value: T;
	readonly orientation: 'horizontal' | 'vertical';
	/** Whether `onbeforenext` or `onfinish` is in flight. */
	readonly pending: boolean;
	readonly isFirst: boolean;
	readonly isLast: boolean;
	stateOf: (step: T) => StepState;
	canVisit: (step: T) => boolean;
	/** Moves to a step if it may be visited. Runs no validation. */
	goTo: (step: T) => void;
	/** Validates the current step, marks it complete and moves on - or finishes, on the last one. */
	next: () => Promise<boolean>;
	previous: () => void;
	triggerId: (step: T) => string;
	contentId: (step: T) => string;
};

const [getContext, setContext] = createContext<StepperContext>();

export { setContext as setStepper };

/** The stepper's shared state. Typed by the caller, because context cannot carry a generic. */
export function getStepper<T>(): StepperContext<T> {
	try {
		return getContext() as StepperContext<T>;
	} catch {
		throw new Error('A stepper piece was rendered outside <Stepper>. Wrap it in the root.');
	}
}
