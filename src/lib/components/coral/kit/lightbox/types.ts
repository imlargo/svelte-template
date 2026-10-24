/**
 * @coral/kit/lightbox
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Dialog } from '#lib/components/ui/dialog/index.js';

/** What the default slide reads from an item. */
export type LightboxMedia = {
	/** `image` unless said otherwise. */
	kind?: 'image' | 'video';
	src: string;
	/** For an image, what it shows; for a video, its accessible name. */
	alt?: string;
	/** A video's still frame, shown before it plays. */
	poster?: string;
};

/** What the `media` snippet receives. */
export type MediaContext<T> = {
	item: T;
	index: number;
	/** Whether this is the slide being shown. */
	current: boolean;
};

/** Everything the shadcn dialog root accepts - `onOpenChange`, `onOpenChangeComplete` - stays available. */
type RootProps = Omit<ComponentProps<typeof Dialog>, 'children' | 'open'>;

export type LightboxProps<T> = RootProps & {
	/** The gallery, in order. */
	items: T[];
	/** Maps an item to what the default slide draws. Identity by default. */
	getMedia?: (item: T) => LightboxMedia;
	/** Whether the viewer is showing. Bindable. */
	open?: boolean;
	/** Which item is showing. Bindable: set it before opening to start from a thumbnail. */
	index?: number;
	/** The reader moved to another item - by key, swipe or button. Never when `index` is set from code. */
	onindexchange?: (index: number) => void;
	/** Names the viewer for a screen reader. */
	label?: string;
	/** Where the reader is, said out loud and shown. Receives the position and the total, 1-based. */
	positionLabel?: (position: number, total: number) => string;
	/** Accessible label of the control that moves back. */
	previousLabel?: string;
	/** Accessible label of the control that moves forward. */
	nextLabel?: string;
	/** Merged onto the dialog content. */
	class?: string;
	/** Replaces what a slide draws. The slide itself, and the moving between slides, stay. */
	media?: Snippet<[MediaContext<T>]>;
	/** Rendered under the slides, beside the position - a caption, actions on the current item. */
	footer?: Snippet<[MediaContext<T>]>;
};

/** What a project can state once for every lightbox - see `lib/defaults`. */
export type LightboxDefaults = Partial<
	Pick<LightboxProps<unknown>, 'label' | 'positionLabel' | 'previousLabel' | 'nextLabel'>
>;

declare global {
	interface CoralDefaults {
		'kit/lightbox'?: LightboxDefaults;
	}
}
