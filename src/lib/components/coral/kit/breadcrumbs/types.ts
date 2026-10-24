/**
 * @coral/kit/breadcrumbs
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { Breadcrumb } from '#lib/components/ui/breadcrumb/index.js';

/** One page in the trail. The last one is the current page and needs no `href`. */
export type Crumb = {
	label: string;
	href?: string;
};

/** What the `item` snippet receives. */
export type CrumbContext = {
	crumb: Crumb;
	index: number;
	/** The last crumb, which is the page being read. */
	current: boolean;
};

/** Everything the shadcn breadcrumb root accepts - `class`, `aria-*`, `ref` - stays available. */
type RootProps = Omit<ComponentProps<typeof Breadcrumb>, 'children'>;

export type BreadcrumbsProps = RootProps & {
	/** The trail, root first. The last entry is the current page. */
	items: Crumb[];
	/** Accessible name of the control that lists the folded pages. */
	foldedLabel?: string;
	/** Merged onto the list. */
	listClass?: string;
	/** Replaces what a crumb shows. The link, or the current-page mark, stays around it. */
	item?: Snippet<[CrumbContext]>;
	/** Replaces the separator between crumbs. */
	separator?: Snippet;
};

/** What a project can state once for every trail - see `lib/defaults`. */
export type BreadcrumbsDefaults = Partial<Pick<BreadcrumbsProps, 'foldedLabel'>>;

declare global {
	interface CoralDefaults {
		'kit/breadcrumbs'?: BreadcrumbsDefaults;
	}
}
