/**
 * @coral/kit/stepper
 * @version 1.0.0
 */

/** Where a step stands relative to the current one. */
export type StepState = 'complete' | 'current' | 'upcoming';

/**
 * A step's state. `current` wins over `complete`: going back to fix an earlier step shows it as the
 * one being worked on, even though it was already finished once.
 */
export function stateOf<T>(step: T, current: T, completed: readonly T[]): StepState {
	if (step === current) return 'current';
	return completed.includes(step) ? 'complete' : 'upcoming';
}

export type VisitOptions<T> = {
	steps: readonly T[];
	current: T;
	completed: readonly T[];
	linear: boolean;
};

/**
 * Whether the reader may jump straight to `target`.
 *
 * Backwards is always allowed - revisiting is how a mistake gets fixed. Forwards, a linear stepper
 * allows a step once every step before it is complete, which is what makes jumping ahead to a
 * review step safe: it cannot be reached with an earlier step never validated. That is a rule on
 * completion, not on position, so after going back to step 1 the reader can still return to step 4
 * in one click instead of walking through 2 and 3 again.
 */
export function canVisit<T>(
	target: T,
	{ steps, current, completed, linear }: VisitOptions<T>
): boolean {
	const to = steps.indexOf(target);
	if (to === -1) return false;
	if (!linear || to <= steps.indexOf(current)) return true;
	return steps.slice(0, to).every((step) => completed.includes(step));
}

/** The step `delta` away from `current`, or `undefined` past either end. */
export function adjacent<T>(steps: readonly T[], current: T, delta: number): T | undefined {
	const index = steps.indexOf(current);
	if (index === -1) return undefined;
	return steps[index + delta];
}

/** `completed` with `step` in it, by identity when it already was. */
export function complete<T>(completed: readonly T[], step: T): readonly T[] {
	return completed.includes(step) ? completed : [...completed, step];
}
