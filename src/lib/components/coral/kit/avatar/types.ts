/**
 * @coral/kit/avatar
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Avatar } from '$lib/components/ui/avatar/index.js';

/**
 * Everything the shadcn root accepts - `size`, `class`, `delayMs`, `loadingStatus`, `ref` and
 * any div attribute - stays available. Coral only takes over the body of the avatar, so `child`
 * and `children` are re-declared below.
 */
type RootProps = Omit<ComponentProps<typeof Avatar>, 'child' | 'children'>;

export type AvatarProps = RootProps & {
	/** Image URL. When absent, or when it fails to load, the fallback is shown instead. */
	src?: string;
	/** Alt text for the image. Defaults to `name`, then to `''` (decorative). */
	alt?: string;
	/** Person's name. Used to derive the initials and as the default `alt`. */
	name?: string;
	/** Replaces the initials derived from `name`. Text, or a snippet for a custom fallback. */
	fallback?: string | Snippet;
	/** Extra content rendered inside the root, alongside the image - e.g. an `AvatarBadge`. */
	children?: Snippet;
};
