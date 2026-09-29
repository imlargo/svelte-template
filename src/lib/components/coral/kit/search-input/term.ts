/**
 * @coral/kit/search-input
 * @version 1.0.0
 */

/**
 * The term a search is actually run for, from what is in the field.
 *
 * Trimmed, so `açaí ` and `açaí` are one search rather than two requests for the same results.
 * Below `minLength` it reads as empty rather than as "no search": a reader who had `ab` searched and
 * backspaces to `a` expects the list to stop being filtered by `ab`, and ignoring the short term
 * would leave exactly that filter behind with nothing on screen to explain it. Length is counted in
 * code points, so an emoji or an accented letter typed as one character counts as one.
 */
export function effectiveTerm(raw: string, minLength = 0): string {
	const term = raw.trim();
	return [...term].length < minLength ? '' : term;
}

/**
 * Whether a term is worth reporting. Only a change is: adding a trailing space, or typing a letter
 * and deleting it again inside the debounce window, lands on the term that was already searched,
 * and a caller that fetches on every report would repeat the request for identical results.
 */
export function hasChanged(term: string, previous: string): boolean {
	return term !== previous;
}
