/**
 * @coral/kit/tree-view
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { TreeNode, TreeRow } from './tree.js';

/** What the `node` snippet receives. */
export type NodeContext<T> = TreeRow<T> & {
	selected: boolean;
	/** Opens or closes this node. A no-op on a leaf. */
	toggle: () => void;
};

/**
 * `onselect` is taken over from the DOM attributes: on a `<div>` it is the text-selection event,
 * and leaving both merges the two signatures into one handler that receives either.
 */
export type TreeViewProps<T> = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> & {
	/** The top level of the tree. */
	nodes: TreeNode<T>[];
	/** Ids of the open nodes. Bindable. */
	expanded?: string[];
	/** Id of the selected node. Bindable. */
	selected?: string;
	/** A node was selected - click, Enter or Space. Never for a disabled node. */
	onselect?: (node: TreeNode<T>) => void;
	/**
	 * Nodes were opened or closed. Receives the full list. This is the hook for loading children on
	 * demand: give a node `children: []`, and fetch when its id appears here.
	 */
	onexpandedchange?: (expanded: string[]) => void;
	/** Drives the typeahead's case- and accent-insensitive matching. */
	locale?: string;
	/** Accessible label for the whole tree. Pass this or `aria-labelledby`. */
	label?: string;
	/** Accessible label for the button that opens or closes a node. Receives the node. */
	toggleLabel?: (node: TreeNode<T>, expanded: boolean) => string;
	/** The root element. Bindable. */
	ref?: HTMLDivElement | null;
	/** Merged onto the root. Carries the indent knob - `[--coral-indent:1.5rem]`. */
	class?: string;
	/** Merged onto every row. */
	rowClass?: string;
	/** Replaces the body of each row, after the expand icon. */
	node?: Snippet<[NodeContext<T>]>;
	/** Replaces the expand icon. Rendered for expandable rows only. */
	icon?: Snippet<[NodeContext<T>]>;
};

export type { TreeNode, TreeRow } from './tree.js';
