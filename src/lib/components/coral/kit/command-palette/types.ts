/**
 * @coral/kit/command-palette
 * @version 1.0.0
 */

import type { ComponentProps, Snippet } from 'svelte';
import type { CommandDialog } from '$lib/components/ui/command/index.js';
import type { CommandAction } from './actions.js';

/** What the `action` snippet receives. */
export type ActionContext = {
	action: CommandAction;
	/** It is the one currently running. */
	pending: boolean;
};

/**
 * Everything the shadcn command dialog accepts - `title`, `description`, `portalProps` - stays
 * available. `open` and `children` are Coral's: the palette owns its own body.
 */
type DialogProps = Omit<ComponentProps<typeof CommandDialog>, 'open' | 'children' | 'value'>;

export type CommandPaletteProps = DialogProps & {
	/** Everything the palette can do. */
	actions: CommandAction[];
	/** Whether the palette is showing. Bindable. */
	open?: boolean;
	/**
	 * The combo that opens it, in `kit/shortcut` syntax - `mod` is Command on a Mac and Control
	 * elsewhere. Pass an empty string to bind nothing and open it yourself.
	 */
	shortcut?: string;
	/**
	 * Whether an action's own `shortcut` is bound while the palette is mounted, so it can be run
	 * without opening it. Off leaves those shortcuts as documentation.
	 */
	bindActionShortcuts?: boolean;
	/**
	 * Ids of recently run actions, most recent first. Bindable: the palette puts each action it runs
	 * at the front, and where that list is kept - a store, `localStorage`, the server - is the
	 * project's to decide.
	 */
	recent?: string[];
	/** How many recents are lifted to the top. */
	maxRecent?: number;
	/** Heading for the lifted group. */
	recentLabel?: string;
	/** The search term. Bindable, so it can be read or reset. */
	search?: string;
	/** Called as the reader types - the hook for searching on a server. */
	onsearch?: (term: string) => void;
	/** Milliseconds of quiet typing before `onsearch` runs. */
	searchDebounce?: number;
	/** Renders a loading row in place of the list. Pair with `onsearch`. */
	loading?: boolean;
	/** An action ran and did not refuse. */
	onrun?: (action: CommandAction) => void;
	/** Receives whatever an action threw. Without it the error becomes an unhandled rejection. */
	onerror?: (error: unknown, action: CommandAction) => void;
	/** Shown in the search box. */
	placeholder?: string;
	/** Shown when nothing matches. */
	emptyMessage?: string;
	/**
	 * The primitive's Ctrl+N/P/J/K list navigation. Left alone, it is on unless it would swallow a
	 * combo this palette binds - see the docs on `mod+k` off a Mac.
	 */
	vimBindings?: boolean;
	/** Merged onto the dialog. */
	class?: string;
	/** Merged onto the list. */
	listClass?: string;
	/** The element that opens the palette. Spread `props` onto it. */
	trigger?: Snippet<[{ props: Record<string, unknown>; open: boolean }]>;
	/** Replaces the body of each row - the icon, the label, what sits on the right. */
	action?: Snippet<[ActionContext]>;
	/** Replaces the loading row. */
	indicator?: Snippet;
	/** Replaces the empty state. */
	empty?: Snippet;
	/** Rendered below the list, inside the dialog - a legend, a hint. */
	footer?: Snippet;
};

export type { CommandAction, CommandGroup } from './actions.js';
