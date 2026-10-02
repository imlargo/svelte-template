/**
 * @coral/kit/date-picker
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Calendar } from '#lib/components/ui/calendar/index.js';
import type { RangeCalendar } from '#lib/components/ui/range-calendar/index.js';
import type { PopoverContent } from '#lib/components/ui/popover/index.js';
import type { TriggerAttributes } from '../../lib/trigger.js';
import type { Preset } from './presets.js';

/**
 * A day, as the calendar hands it over.
 *
 * Derived from the range calendar rather than imported from `@internationalized/date`, which is
 * the same reason Coral derives `ComponentProps<typeof Avatar>` instead of reaching for `bits-ui`:
 * a project that has the shadcn calendar has this type by construction, and Coral never names the
 * library underneath. The range is the convenient end to derive from - it carries both.
 */
export type DateRange = NonNullable<ComponentProps<typeof RangeCalendar>['value']>;
export type DateValue = NonNullable<DateRange['start']>;

/** Whether the picker selects one day or two. */
export type DatePickerType = 'single' | 'range';

/** The shape of `value` for a given mode. */
export type DatePickerValue<Type extends DatePickerType> = Type extends 'range'
	? DateRange | undefined
	: DateValue | undefined;

/** What the `trigger` snippet receives. Spread `props` onto whatever element you render. */
export type TriggerContext<Type extends DatePickerType> = {
	props: Record<string, unknown>;
	value: DatePickerValue<Type>;
	/** Exactly what the default trigger prints: the active preset's label, the formatted
	 * selection, or the placeholder. */
	label: string;
	/** Whether anything is selected. A half-picked range is not empty. */
	empty: boolean;
	open: boolean;
	disabled: boolean;
	clear: () => void;
};

/** What the `footer` snippet receives. Rendered below the calendar, inside the popover. */
export type FooterContext<Type extends DatePickerType> = {
	value: DatePickerValue<Type>;
	clear: () => void;
	close: () => void;
};

type BaseProps<Type extends DatePickerType> = TriggerAttributes & {
	type?: Type;
	/** The selection. Bindable. A `DateRange` when `type="range"`. */
	value?: DatePickerValue<Type>;
	/** Whether the popover is open. Bindable. */
	open?: boolean;
	/**
	 * The month on screen. Bindable, and it follows the selection on its own.
	 *
	 * This is the calendar's `placeholder` prop under a name that does not collide with the
	 * trigger's placeholder text. Two things called `placeholder`, one a date and one a string,
	 * is the kind of coin-flip every caller loses once.
	 */
	month?: DateValue;
	/** Shortcuts rendered beside the calendar - "Today", "Last 7 days". */
	presets?: Preset<NonNullable<DatePickerValue<Type>>>[];
	/** Printed on the trigger while nothing is selected. */
	placeholder?: string;
	/** Drives both the calendar's own strings and the formatted trigger label. */
	locale?: string;
	/**
	 * How the trigger prints the selection. Passed straight to `Intl.DateTimeFormat`, so anything
	 * it understands works - `{ dateStyle: 'full' }`, `{ day: '2-digit', month: 'long' }`.
	 *
	 * Leave `timeZone` out of it: the day is formatted where the reader is, which is the point.
	 */
	format?: Intl.DateTimeFormatOptions;
	/** Blocks the trigger and the calendar. */
	disabled?: boolean;
	/** Adds a clear control to the trigger. */
	clearable?: boolean;
	/** Accessible label for the clear control. */
	clearLabel?: string;
	/**
	 * Submits with a surrounding form, as a hidden input holding the ISO day (`2026-01-05`).
	 * A range submits two: `name` and `endName`.
	 */
	name?: string;
	/** The end of a range's field name. Defaults to `${name}-end`. `type="range"` only. */
	endName?: string;
	/** `id` of the form to submit with, for a picker outside it. Ignored without `name`. */
	form?: string;
	/**
	 * Blocks submission while nothing is selected. Needs `name`. On a range it holds for a
	 * half-picked one too, which is not a selection.
	 */
	required?: boolean;
	/** Turns a day into the string a form submits. Defaults to `String`, which is ISO already. */
	serialize?: (value: DateValue) => string;
	/** Which trigger edge the popover lines up with. */
	align?: ComponentProps<typeof PopoverContent>['align'];
	/** Merged onto the trigger button. */
	class?: string;
	/** Merged onto the popover content. */
	contentClass?: string;
	/** Replaces the whole trigger. */
	trigger?: Snippet<[TriggerContext<Type>]>;
	/** Rendered below the calendar - a "clear" action, a hint, a time field. */
	footer?: Snippet<[FooterContext<Type>]>;
	/**
	 * Called when the user picks a day, a preset, or clears - never on mount, and never when
	 * `value` is assigned from code.
	 */
	onchange?: (value: DatePickerValue<Type>) => void;
	onOpenChange?: (open: boolean) => void;
};

/**
 * Whatever the picker names itself, plus the two the calendar names differently: its `placeholder`
 * is Coral's `month`, its `onValueChange` Coral's `onchange`.
 *
 * Derived from `keyof BaseProps`, not listed by hand: the calendar root is a `<div>` and so accepts
 * every HTML attribute - `onchange` among them, the very name this component uses. A hand-kept list
 * gets that wrong once and the prop quietly becomes an intersection with a DOM event handler. The
 * cost is the div's own bubbled `onchange`, the trade every named prop in Coral makes.
 *
 * Instantiated at `DatePickerType`, not `Type`: the key set is the same either way, and leaving the
 * generic unresolved makes `Omit` over the div's attributes explode into an unrepresentable union.
 */
type Driven = keyof BaseProps<DatePickerType> | 'onValueChange' | 'placeholder';

/**
 * Everything the wrapped calendar accepts and Coral does not drive: `minValue`, `maxValue`,
 * `numberOfMonths`, `isDateDisabled`, `captionLayout`, `fixedWeeks`, the `day` snippet, the rest.
 *
 * Coral forwards to the **calendar**, not the popover - the calendar is the primitive with
 * capability worth keeping, and every popover knob a picker needs is already a named prop.
 *
 * The single branch is extracted before anything is omitted: the calendar's props are a union
 * discriminated on `type`, and omitting across it while still crossed with every div attribute
 * produces a union TypeScript refuses to represent. Narrowing first leaves one object type.
 */
type ForwardedProps<Type extends DatePickerType> = Type extends 'range'
	? Omit<ComponentProps<typeof RangeCalendar>, Driven>
	: Omit<Extract<ComponentProps<typeof Calendar>, { type: 'single' }>, Driven>;

/**
 * `Type` decides the shape of `value`, of `presets` and of `onchange`, the same way it does on
 * `kit/combobox`. It is inferred from the `type` prop and defaults to `single`, so the common case
 * stays a plain `<DatePicker bind:value />`.
 */
export type DatePickerProps<Type extends DatePickerType = 'single'> = BaseProps<Type> &
	ForwardedProps<Type>;
