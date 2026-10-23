/**
 * @coral/kit/avatar
 * @version 1.0.1
 */

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** The first character as a reader sees it: an accent typed as its own mark stays on its letter. */
function firstOf(word: string): string {
	const [head] = graphemes.segment(word);
	return head?.segment ?? '';
}

/**
 * Display initials from a person's name: first letter of the first word, plus the first letter of
 * the last one where there is more than one - so `Elena van der Meer` gives `EM`, not `EV`.
 * Uppercased, accents preserved.
 *
 * Empty for blank input, so the caller decides what to render rather than getting a placeholder it
 * never asked for.
 */
export function initials(name: string | null | undefined): string {
	const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
	if (words.length === 0) return '';

	const first = firstOf(words[0]);
	const last = firstOf(words[words.length - 1]);

	return (words.length === 1 ? first : first + last).toLocaleUpperCase();
}
