/**
 * @coral/kit/file-input
 * @version 1.1.1
 */

import { matchesAccept } from './accept.js';

/** Why a file was turned away. */
export type RejectionReason = 'type' | 'size' | 'count';

export type FileRejection = {
	file: File;
	reason: RejectionReason;
};

export type CollectOptions = {
	/** What is already held. */
	current: File[];
	/** The `accept` attribute. Empty takes anything. */
	accept?: string;
	/** Largest allowed size per file, in bytes. Omitted means unbounded. */
	maxSize?: number;
	/** How many files may be held in total. `1` replaces rather than appends. */
	limit: number;
};

/**
 * Whether two files are, for a picker's purposes, the same one. Name, size and last-modified are as
 * close to identity as a `File` gets. Concatenating without the check is the default mistake, so
 * dropping the same file twice puts two identical rows on screen and posts it twice.
 */
function isSameFile(a: File, b: File): boolean {
	return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

/**
 * What the selection should be after some files arrive, and what got turned away. Both routes in -
 * the picker and a drop - funnel through here, so the rules cannot drift between them.
 *
 * Accepting nothing returns `current` by identity rather than rebuilt, which lets the caller tell
 * "nothing changed" from "changed to the same thing" - and stops a rejected pick quietly clearing
 * a single-file field.
 */
export function collect(
	incoming: File[],
	{ current, accept, maxSize, limit }: CollectOptions
): { files: File[]; rejected: FileRejection[] } {
	// A single-file input replaces what it holds; a multiple one appends to it.
	const held = limit === 1 ? [] : current;
	const accepted: File[] = [];
	const rejected: FileRejection[] = [];

	for (const file of incoming) {
		if (accept && !matchesAccept(file, accept)) {
			rejected.push({ file, reason: 'type' });
			continue;
		}
		if (maxSize !== undefined && file.size > maxSize) {
			rejected.push({ file, reason: 'size' });
			continue;
		}
		// Already there: not a rejection, there is nothing for the caller to report or retry.
		if ([...held, ...accepted].some((candidate) => isSameFile(candidate, file))) continue;
		if (held.length + accepted.length >= limit) {
			rejected.push({ file, reason: 'count' });
			continue;
		}
		accepted.push(file);
	}

	return {
		files: accepted.length === 0 ? current : [...held, ...accepted],
		rejected
	};
}
