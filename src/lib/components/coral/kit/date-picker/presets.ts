/**
 * @coral/kit/date-picker
 * @version 1.1.0
 */

/**
 * A shortcut in the popover: a label, and the value it selects.
 *
 * `value` may be a thunk, and for anything relative to now it has to be - computed once at module
 * scope, a tab left open overnight still offers yesterday's "today". It is called on render and
 * again on click, so highlight and selection both read the clock as it is now.
 */
export type Preset<Value> = {
	label: string;
	value: Value | (() => Value);
};

/** The value a preset stands for, right now. */
export function resolvePreset<Value>(preset: Preset<Value>): Value {
	return typeof preset.value === 'function' ? (preset.value as () => Value)() : preset.value;
}

/**
 * The preset the current selection came from, if any - the whole reason presets live in Coral
 * rather than in a `{#each}` beside the calendar. The row has to know which entry is current, and
 * that means comparing days, not identity: a preset hands back a fresh value every call, so `===`
 * is always false. First match wins; two presets resolving alike are the caller's to disambiguate.
 */
export function activePreset<Value>(
	presets: Preset<Value>[],
	value: Value | undefined,
	equals: (a: Value | undefined, b: Value | undefined) => boolean
): Preset<Value> | undefined {
	if (value === undefined) return undefined;
	return presets.find((preset) => equals(resolvePreset(preset), value));
}
