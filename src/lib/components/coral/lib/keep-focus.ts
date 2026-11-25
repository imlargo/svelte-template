/**
 * @coral/lib/keep-focus
 * @version 1.0.0
 */

import type { Attachment } from 'svelte/attachments';

const FOCUSABLE =
	'button:not(:disabled), [href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

const firstFocusable = (row: Element | undefined) =>
	row?.querySelector<HTMLElement>(FOCUSABLE) ?? undefined;

/**
 * Keeps keyboard focus in a list of rows when the control holding it leaves the page.
 *
 * Removing the focused element sends focus to the body, and the next Tab starts over at the top
 * of the page. In a list of files that happens on every remove, and also on a cancel button that
 * turns into a retry or a row whose upload finishes, so it is caught from the DOM rather than at
 * each place that changes it: focus goes to the same row if it is still there, then to the row
 * that took its place, then the one before, and to `fallback` once the list is empty.
 *
 * Attached to an element that outlives the list, so a list that renders nothing when empty is
 * still watched. `rows` selects the rows inside it; `fallback` receives that element.
 */
export function keepFocus(
	rows: string,
	fallback: (root: HTMLElement) => HTMLElement | null | undefined
): Attachment<HTMLElement> {
	return (root) => {
		let row: Element | null = null;
		let index = -1;
		let held: Element | null = null;

		const restore = () => {
			if (!held || held.isConnected) return;
			// Only focus that fell to nowhere is moved: a reader who went elsewhere is left there.
			const active = document.activeElement;
			if (active && active !== document.body) return forget();

			const all = Array.from(root.querySelectorAll(rows));
			const target =
				(row?.isConnected ? firstFocusable(row) : undefined) ??
				firstFocusable(all[index]) ??
				firstFocusable(all[Math.min(index, all.length) - 1]) ??
				fallback(root);
			forget();
			target?.focus();
		};

		const forget = () => {
			row = null;
			index = -1;
			held = null;
		};

		const focusin = (event: FocusEvent) => {
			const target = event.target as Element;
			const found = target.closest(rows);
			if (!found || !root.contains(found)) return forget();
			row = found;
			index = Array.from(root.querySelectorAll(rows)).indexOf(found);
			held = target;
		};

		/**
		 * A blur to nowhere with the element still on the page is the reader clicking on empty
		 * space, and they are let go. Read a tick later, because some browsers do fire a blur for an
		 * element being removed, and it is still connected while the event runs.
		 */
		const focusout = (event: FocusEvent) => {
			const next = event.relatedTarget;
			if (next instanceof Node) {
				if (!root.contains(next)) forget();
				return;
			}
			const target = event.target as Element;
			queueMicrotask(() => {
				if (target === held && target.isConnected) forget();
			});
		};

		const observer = new MutationObserver(restore);
		observer.observe(root, { childList: true, subtree: true });
		root.addEventListener('focusin', focusin);
		root.addEventListener('focusout', focusout);

		return () => {
			observer.disconnect();
			root.removeEventListener('focusin', focusin);
			root.removeEventListener('focusout', focusout);
		};
	};
}
