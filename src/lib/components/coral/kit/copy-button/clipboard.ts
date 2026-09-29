/**
 * @coral/kit/copy-button
 * @version 1.0.0
 */

/** What a copy button can be handed: the text itself, or a way to produce it when clicked. */
export type CopySource = string | (() => string | Promise<string>);

/**
 * Reads the source at click time, not render time. A function is how a caller copies something
 * expensive or not yet known - a signed URL, the current contents of an editor - without computing
 * it on every render for a click that may never come.
 */
export async function resolveText(source: CopySource): Promise<string> {
	return typeof source === 'function' ? await source() : source;
}

/**
 * Puts text on the clipboard, and rejects when it did not get there.
 *
 * The async Clipboard API only exists in a secure context - `https`, or `localhost`. A project
 * previewed over a LAN address, or embedded in a webview that withholds the permission, has no
 * `navigator.clipboard` at all, and a button that silently does nothing there is worse than one
 * that says it failed. So the old selection-based copy is kept as a fallback, and its own failure
 * is reported instead of assumed away.
 */
export async function writeText(text: string): Promise<void> {
	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return;
		} catch (error) {
			// A denied permission is final; anything else - an unfocused document, a missing API in
			// an embedded browser - may still go through the selection route.
			if (error instanceof DOMException && error.name === 'NotAllowedError' && !canExecCopy()) {
				throw error;
			}
		}
	}

	if (!execCopy(text)) throw new Error('Copying to the clipboard is not supported here.');
}

function canExecCopy(): boolean {
	return typeof document !== 'undefined' && typeof document.execCommand === 'function';
}

/**
 * Copies through a throwaway `<textarea>` and `execCommand('copy')` - deprecated, and still the
 * only route where the async API is missing.
 *
 * The field is `readonly` so a mobile keyboard does not open for it, and parked off-screen instead
 * of hidden, because a `display: none` element cannot hold a selection. Whatever the reader had
 * selected, and whatever had focus, is put back afterwards.
 */
function execCopy(text: string): boolean {
	if (!canExecCopy()) return false;

	const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const selection = document.getSelection();
	const ranges = selection
		? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index))
		: [];

	const field = document.createElement('textarea');
	field.value = text;
	field.setAttribute('readonly', '');
	field.style.position = 'fixed';
	field.style.insetInlineStart = '-9999px';
	field.style.top = '0';
	document.body.appendChild(field);
	field.select();

	let copied: boolean;
	try {
		copied = document.execCommand('copy');
	} catch {
		copied = false;
	} finally {
		field.remove();
		if (selection) {
			selection.removeAllRanges();
			for (const range of ranges) selection.addRange(range);
		}
		active?.focus({ preventScroll: true });
	}

	return copied;
}
