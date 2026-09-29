/**
 * @coral/kit/command-palette
 * @version 1.0.0
 */

/** Something the palette can do. `run` is the only part the palette itself understands. */
export type CommandAction = {
	/** Stable across renders: it is what `recent` remembers and what keys the list. */
	id: string;
	label: string;
	/** A second line, and part of what a search matches. */
	description?: string;
	/** Extra terms that should find this action without being shown - a synonym, an old name. */
	keywords?: string[];
	/** Heading to file it under. Actions with no group come first, ungrouped. */
	group?: string;
	/** Its own shortcut, as `mod+shift+p`. Drawn beside the action, and bound while the palette is mounted. */
	shortcut?: string;
	/** Blocks it. It stays listed, because hiding it is how a reader concludes it does not exist. */
	disabled?: boolean;
	/**
	 * What it does. Return a promise and the palette waits; return exactly `false`, or throw, and it
	 * stays open - the convention every Coral component that waits on a request follows.
	 */
	run: () => unknown;
};

export type CommandGroup = {
	label?: string;
	actions: CommandAction[];
};

/**
 * What a search is matched against: everything worth finding an action by, in one string.
 *
 * The list is filtered by the shadcn `command` primitive, which scores an item by this value, so
 * keywords have to travel inside it rather than as a separate field.
 */
export function searchValue(action: CommandAction): string {
	return [action.label, action.description, ...(action.keywords ?? []), action.group]
		.filter(Boolean)
		.join(' ');
}

export type GroupOptions = {
	/** Ids of recently run actions, most recent first. */
	recent?: readonly string[];
	/** How many of them to lift out. */
	maxRecent?: number;
	/** Heading for the lifted group. */
	recentLabel?: string;
};

/**
 * The actions as the palette lists them: recents first, then each group in the order its first
 * action appears.
 *
 * Recents are lifted rather than reordered in place. A palette that re-sorts itself as it is used
 * moves the thing under the cursor between one opening and the next, and the reader ends up reading
 * every time instead of building the muscle memory the palette exists for. Lifting keeps the rest
 * of the list exactly where it was.
 *
 * A recent action that no longer exists - a feature turned off, a document deleted - is skipped
 * rather than dropped from `recent`, so it comes back if it does.
 */
export function group(
	actions: readonly CommandAction[],
	{ recent = [], maxRecent = 5, recentLabel = 'Recent' }: GroupOptions = {}
): CommandGroup[] {
	const byId = new Map(actions.map((action) => [action.id, action]));

	const lifted: CommandAction[] = [];
	for (const id of recent) {
		if (lifted.length >= maxRecent) break;
		const action = byId.get(id);
		if (action && !action.disabled) lifted.push(action);
	}

	const liftedIds = new Set(lifted.map((action) => action.id));
	const groups: CommandGroup[] = [];
	const byLabel = new Map<string | undefined, CommandGroup>();

	for (const action of actions) {
		// A lifted action is not repeated below: the same row twice, one of them stale, reads as two
		// different actions that happen to share a name.
		if (liftedIds.has(action.id)) continue;

		let bucket = byLabel.get(action.group);
		if (!bucket) {
			bucket = { label: action.group, actions: [] };
			byLabel.set(action.group, bucket);
			groups.push(bucket);
		}
		bucket.actions.push(action);
	}

	return lifted.length > 0 ? [{ label: recentLabel, actions: lifted }, ...groups] : groups;
}

/** `recent` with `id` at the front, capped. What a caller persists after an action runs. */
export function remember(recent: readonly string[], id: string, max = 20): string[] {
	return [id, ...recent.filter((entry) => entry !== id)].slice(0, max);
}
