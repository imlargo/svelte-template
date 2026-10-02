/**
 * @coral/kit/tree-view
 * @version 1.0.0
 */

import { collator } from '../../lib/intl.js';

export type TreeNode<T = unknown> = {
	/** Unique across the whole tree. It keys expansion, selection and focus. */
	id: string;
	/** What the row says, and what typeahead matches against. */
	label: string;
	/**
	 * The node's children. Leave it out for a leaf. An empty array is a branch with nothing in it
	 * yet - it can be expanded, which is what a folder loaded on demand needs to be.
	 */
	children?: TreeNode<T>[];
	/** Blocks selection. The node stays focusable, so it can still be read and expanded. */
	disabled?: boolean;
	/** Whatever the caller needs back in `onselect` and the `node` snippet. */
	data?: T;
};

/** One visible row: a node plus where it sits. */
export type TreeRow<T = unknown> = {
	node: TreeNode<T>;
	/** 1 at the top, as `aria-level` counts. */
	level: number;
	parentId: string | undefined;
	/** 1-based position among its siblings, and how many siblings there are - `aria-posinset/setsize`. */
	position: number;
	siblings: number;
	expandable: boolean;
	expanded: boolean;
};

export function isExpandable(node: TreeNode<unknown>): boolean {
	return Array.isArray(node.children);
}

/**
 * The rows that are on screen, in reading order: every node whose ancestors are all expanded.
 *
 * The tree is drawn from this flat list rather than by nesting groups. It is the same thing to a
 * screen reader - the level, position and size attributes carry the structure - and it turns every
 * keyboard move into a step along one array instead of a walk up and down a nested DOM.
 */
export function visibleRows<T>(
	nodes: readonly TreeNode<T>[],
	expanded: ReadonlySet<string>
): TreeRow<T>[] {
	const rows: TreeRow<T>[] = [];

	const walk = (level: readonly TreeNode<T>[], depth: number, parentId: string | undefined) => {
		level.forEach((node, index) => {
			const expandable = isExpandable(node);
			const open = expandable && expanded.has(node.id);
			rows.push({
				node,
				level: depth,
				parentId,
				position: index + 1,
				siblings: level.length,
				expandable,
				expanded: open
			});
			if (open) walk(node.children ?? [], depth + 1, node.id);
		});
	};

	walk(nodes, 1, undefined);
	return rows;
}

/** Every ancestor id of `id`, nearest first. Empty for a top-level node or an unknown id. */
export function ancestorsOf(nodes: readonly TreeNode<unknown>[], id: string): string[] {
	const path: string[] = [];

	const find = (level: readonly TreeNode<unknown>[]): boolean => {
		for (const node of level) {
			if (node.id === id) return true;
			if (node.children && find(node.children)) {
				path.push(node.id);
				return true;
			}
		}
		return false;
	};

	find(nodes);
	return path;
}

/** The ids of the expandable nodes that share a parent with `row` - what `*` opens. */
export function expandableSiblings<T>(rows: readonly TreeRow<T>[], row: TreeRow<T>): string[] {
	return rows
		.filter((other) => other.parentId === row.parentId && other.expandable)
		.map((other) => other.node.id);
}

/**
 * The next row whose label starts with `query`, searching after `from` and wrapping - so pressing
 * the same letter again moves to the next match rather than staying put.
 *
 * Compared with a base-sensitivity collator, which treats `e`, `E` and `é` alike: a reader typing
 * `a` for "Ánanas" should land on it. A query of one repeated letter cycles through that letter's
 * matches, the way a native `<select>` and every file manager do.
 */
export function typeahead<T>(
	rows: readonly TreeRow<T>[],
	from: number,
	query: string,
	locale?: string
): number {
	if (query === '' || rows.length === 0) return -1;

	const compare = collator(locale, { sensitivity: 'base', usage: 'search' });
	const chars = [...query];
	const repeated = chars.every((char) => char === chars[0]);
	const needle = repeated ? chars[0] : query;
	// A repeated letter moves on from the current row; a longer query may still match it.
	const start = repeated || chars.length === 1 ? from + 1 : from;

	for (let offset = 0; offset < rows.length; offset++) {
		const index = (start + offset) % rows.length;
		const label = [...rows[index].node.label].slice(0, [...needle].length).join('');
		if (compare.compare(label, needle) === 0) return index;
	}
	return -1;
}
