/**
 * @coral/kit/phone-input
 * @version 1.0.0
 */

/** What the formatter keeps from the field: digits, and the plus in front of them. */
const SIGNIFICANT = /[\d+]/;

/** How many significant characters come before `index`. */
export function significantBefore(text: string, index: number): number {
	let count = 0;
	for (const character of text.slice(0, index)) if (SIGNIFICANT.test(character)) count++;
	return count;
}

/** The index right after the `count`th significant character - where the caret goes back to. */
export function indexAfter(text: string, count: number): number {
	if (count === 0) return 0;

	let seen = 0;
	for (let index = 0; index < text.length; index++) {
		if (SIGNIFICANT.test(text[index]) && ++seen === count) return index + 1;
	}
	return text.length;
}

/**
 * Deleting a space or a bracket the formatter wrote deletes nothing: the formatter writes it right
 * back, and the caret is stuck in front of it. This deletes the digit beside it instead, on the side
 * the key points to, which is what the reader meant.
 */
export function deleteDigit(
	text: string,
	caret: number,
	direction: 'backward' | 'forward'
): { text: string; caret: number } {
	if (direction === 'backward') {
		for (let index = caret - 1; index >= 0; index--) {
			if (SIGNIFICANT.test(text[index])) {
				return { text: text.slice(0, index) + text.slice(index + 1), caret: index };
			}
		}
	} else {
		for (let index = caret; index < text.length; index++) {
			if (SIGNIFICANT.test(text[index])) {
				return { text: text.slice(0, index) + text.slice(index + 1), caret };
			}
		}
	}
	return { text, caret };
}
