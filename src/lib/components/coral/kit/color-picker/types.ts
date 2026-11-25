/**
 * @coral/kit/color-picker
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PopoverContent } from '#lib/components/ui/popover/index.js';
import type { Option } from '../../lib/options.js';
import type { TriggerAttributes } from '../../lib/trigger.js';

type DivProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'>;

/** A preset colour: a hex, or an option whose label names it for a screen reader. */
export type Swatch = string | Option<string>;

export type ColorAreaProps = DivProps & {
	/** The hue the square is drawn in, `0` to `360`. */
	hue: number;
	/** Left to right, `0` to `1`. Bindable. */
	saturation?: number;
	/** Bottom to top, `0` to `1`. Bindable. */
	brightness?: number;
	disabled?: boolean;
	/** A drag let go, or a key moved the thumb: the moment a change is worth keeping. */
	oncommit?: () => void;
	/** Names the thumb. */
	label?: string;
	/** What a screen reader hears for the thumb's position. */
	valueText?: (saturation: number, brightness: number) => string;
	/** Drives the percentages in the default `valueText`. */
	locale?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the square. */
	class?: string;
	/** Merged onto the thumb. */
	thumbClass?: string;
};

export type HueSliderProps = DivProps & {
	/** The hue, `0` to `360`. Bindable. */
	value?: number;
	disabled?: boolean;
	/** A drag let go, or a key moved the thumb. */
	oncommit?: () => void;
	/** Names the thumb. */
	label?: string;
	/** What a screen reader hears for the hue. */
	valueText?: (hue: number) => string;
	/** Drives the number in the default `valueText`. */
	locale?: string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the strip. */
	class?: string;
	/** Merged onto the thumb. */
	thumbClass?: string;
};

/** The words the panel says, all of them for a screen reader. */
type PanelCopy = {
	/** Names the saturation and brightness square. */
	areaLabel?: string;
	/** What a screen reader hears for a position in the square. */
	areaValueText?: (saturation: number, brightness: number) => string;
	/** Names the hue strip. */
	hueLabel?: string;
	/** What a screen reader hears for a hue. */
	hueValueText?: (hue: number) => string;
	/** Names the hex field. */
	hexLabel?: string;
	/** Names the swatch group. */
	swatchesLabel?: string;
	/** Names the button that picks a colour from the screen. */
	eyeDropperLabel?: string;
};

export type ColorPanelProps = DivProps &
	PanelCopy & {
		/** The colour, as `#rrggbb`. Bindable, and live while dragging. `undefined` is none. */
		value?: string;
		/**
		 * The hue the panel is on. Bindable. A grey or a black has none of its own, so a panel that
		 * is mounted again - inside a popover, say - reads it from here instead of from `value`.
		 */
		hue?: number;
		/**
		 * The colour was picked: a drag let go, a key, a hex typed and committed, a swatch, the
		 * eyedropper. Once per gesture rather than once per pointer move, so it is where a save goes.
		 * Never on mount, and never when `value` is assigned from code.
		 */
		onchange?: (value: string) => void;
		/** Preset colours offered under the editor. */
		swatches?: Swatch[];
		disabled?: boolean;
		/** Drives the numbers a screen reader hears. */
		locale?: string;
		/** The root element. Bindable. */
		ref?: HTMLDivElement | null;
		/** Merged onto the root. */
		class?: string;
		/** Rendered last, under the swatches - a hint, a reset action. */
		children?: Snippet;
	};

/** What the `trigger` snippet receives. Spread `props` onto the element you render. */
export type ColorTriggerContext = {
	props: Record<string, unknown>;
	value: string | undefined;
	open: boolean;
	disabled: boolean;
};

export type ColorPickerProps = Omit<ColorPanelProps, 'class' | 'ref' | 'children' | 'hue'> &
	TriggerAttributes & {
		/** Whether the popover is open. Bindable. */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Printed on the trigger while there is no colour. */
		placeholder?: string;
		/** Submits the hex with a surrounding form. */
		name?: string;
		/** `id` of the form to submit with, for a picker outside it. Ignored without `name`. */
		form?: string;
		/** Blocks submission while there is no colour. Needs `name`. */
		required?: boolean;
		/** Which trigger edge the popover lines up with. */
		align?: ComponentProps<typeof PopoverContent>['align'];
		/** The trigger button. Bindable. */
		ref?: HTMLButtonElement | null;
		/** Merged onto the trigger button. */
		class?: string;
		/** Merged onto the popover content. */
		contentClass?: string;
		/** Replaces the trigger. */
		trigger?: Snippet<[ColorTriggerContext]>;
		/** Rendered under the panel, inside the popover. */
		children?: Snippet;
	};

/** What a project can state once for every colour picker and panel - see `lib/defaults`. */
export type ColorPickerDefaults = Partial<PanelCopy & Pick<ColorPickerProps, 'placeholder'>>;

declare global {
	interface CoralDefaults {
		'kit/color-picker'?: ColorPickerDefaults;
	}
}
