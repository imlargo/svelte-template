/**
 * @coral/kit/rating-group
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type StarContext = {
	/** Which star, counting from zero. */
	index: number;
	/** How much of it is filled, `0` to `1`. The track layer always gets `0`. */
	fill: number;
};

export type RatingGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	/** The rating. Bindable. `0` is unrated. */
	value?: number;
	/** How many stars. */
	count?: number;
	/** Halves the step, so a star can be picked half-lit. */
	allowHalf?: boolean;
	/**
	 * Draws the rating without offering to change it.
	 *
	 * Not a disabled control: it leaves the tab order entirely and is exposed as an image with the
	 * rating as its name, which is what showing someone else's average actually is. It is also the
	 * only mode that draws `value` unrounded - `4.3` is four stars and a third.
	 */
	readonly?: boolean;
	/** Blocks the control, keeping it in the page as something that could have been used. */
	disabled?: boolean;
	/** Requires a rating before the surrounding form submits. Needs `name`. */
	required?: boolean;
	/** Posts the rating under this name. Without it nothing is submitted - see the docs. */
	name?: string;
	/** `id` of the form to post with, for a control that sits outside it. */
	form?: string;
	/** Drives the number in the default label. */
	locale?: string;
	/** The busiest fill. Any CSS colour; keep it a theme token to stay themeable. */
	color?: string;
	/** The colour of the part that is not filled in. */
	emptyColor?: string;
	/**
	 * Names a rating - one option's label, and the whole control's when it is `readonly`.
	 *
	 * Defaults to `4,3 / 5`: deliberately wordless, because `4 out of 5 stars` is copy, copy is the
	 * project's, and Coral does not know what is being rated.
	 */
	label?: (value: number, count: number) => string;
	/** The rating changed. Never on mount, and never when `value` is assigned from code. */
	onchange?: (value: number) => void;
	/** The pointer moved onto a rating, or off the control entirely (`null`). */
	onhover?: (value: number | null) => void;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. Carries the size knob - `[--coral-star:2rem]`. */
	class?: string;
	/** Merged onto every star. */
	starClass?: string;
	/**
	 * Replaces the glyph. Rendered twice per star - once as the track with `fill: 0`, once clipped
	 * to the real fill - so swapping the shape keeps half stars working with no second snippet.
	 */
	star?: Snippet<[StarContext]>;
};
